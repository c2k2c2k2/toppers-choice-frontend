"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation } from "@/lib/auth";
import {
  createNoteViewSession,
  getNoteAccessDescriptor,
  getNoteWatermark,
  getOptionalNumber,
  getReaderStartPage,
  isNoteSessionErrorMessage,
  updateNoteProgress,
  type NoteDetailResponse,
  type NoteProgressResponse,
  type NotesListResponse,
  type NotesTreeResponse,
  type NoteViewSessionResponse,
  type NoteWatermarkResponse,
} from "@/lib/notes";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { PremiumAccessCard } from "@/components/payments/premium-access-card";
import { buildStudentPlansHref } from "@/lib/payments";
import { PdfCanvasViewer } from "@/components/student/pdf-canvas-viewer";
import { useNoteReaderStore, useStudentShellStore } from "@/stores";

type ReaderState = "error" | "expired" | "idle" | "ready" | "starting";

function replaceNoteProgress(
  note: NoteDetailResponse,
  progress: NoteProgressResponse,
): NoteDetailResponse {
  return {
    ...note,
    progress,
  };
}

function replaceProgressInNotesList(
  current: NotesListResponse | undefined,
  noteId: string,
  progress: NoteProgressResponse,
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    items: current.items.map((note) =>
      note.id === noteId
        ? {
            ...note,
            progress,
          }
        : note,
    ),
  };
}

function replaceProgressInTree(
  current: NotesTreeResponse | undefined,
  noteId: string,
  progress: NoteProgressResponse,
): NotesTreeResponse | undefined {
  if (!current) {
    return current;
  }

  return {
    ...current,
    subjects: current.subjects.map((subject) => ({
      ...subject,
      notes: subject.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              progress,
            }
          : note,
      ),
      topics: replaceProgressInTopics(subject.topics, noteId, progress),
    })),
  };
}

function replaceProgressInTopics(
  topics: NotesTreeResponse["subjects"][number]["topics"],
  noteId: string,
  progress: NoteProgressResponse,
): NotesTreeResponse["subjects"][number]["topics"] {
  return topics.map((topic) => ({
    ...topic,
    notes: topic.notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            progress,
          }
        : note,
    ),
    children: replaceProgressInTopics(topic.children, noteId, progress),
  }));
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SecureNoteReader({
  note,
}: Readonly<{
  note: NoteDetailResponse;
}>) {
  const queryClient = useQueryClient();
  const initialStartPage = getReaderStartPage(note);
  const accessDescriptor = getNoteAccessDescriptor(note.access);
  const focusMode = useNoteReaderStore((state) => state.focusMode);
  const preferredZoom = useNoteReaderStore((state) => state.preferredZoom);
  const setFocusMode = useNoteReaderStore((state) => state.setFocusMode);
  const setLastOpenedNoteId = useNoteReaderStore(
    (state) => state.setLastOpenedNoteId,
  );
  const setPreferredZoom = useNoteReaderStore(
    (state) => state.setPreferredZoom,
  );
  const setBottomNavVisible = useStudentShellStore(
    (state) => state.setBottomNavVisible,
  );
  const [currentPage, setCurrentPage] = useState(initialStartPage);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerState, setReaderState] = useState<ReaderState>("idle");
  const [session, setSession] = useState<NoteViewSessionResponse | null>(null);
  const [sessionStartPage, setSessionStartPage] = useState(initialStartPage);
  const [syncedPage, setSyncedPage] = useState(
    getOptionalNumber(note.progress?.lastPageViewed) ?? 0,
  );
  const [watermarkPayload, setWatermarkPayload] =
    useState<NoteWatermarkResponse | null>(null);

  const createSessionMutation = useAuthenticatedMutation({
    mutationFn: (noteId: string, accessToken: string) =>
      createNoteViewSession(noteId, accessToken),
  });

  const progressMutation = useAuthenticatedMutation({
    mutationFn: (
      variables: {
        lastPageViewed: number;
        noteId: string;
      },
      accessToken: string,
    ) =>
      updateNoteProgress(
        variables.noteId,
        {
          lastPageViewed: variables.lastPageViewed,
        },
        accessToken,
      ),
  });

  useEffect(() => {
    setLastOpenedNoteId(note.id);
  }, [note.id, setLastOpenedNoteId]);

  useEffect(() => {
    const shouldShowBottomNav = readerState !== "ready";
    setBottomNavVisible(shouldShowBottomNav);

    return () => setBottomNavVisible(true);
  }, [readerState, setBottomNavVisible]);

  useEffect(() => {
    if (readerState !== "ready" || !session || currentPage < 1) {
      return;
    }

    if (currentPage === syncedPage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void progressMutation
        .mutateAsync({
          lastPageViewed: currentPage,
          noteId: note.id,
        })
        .then((progress) => {
          setSyncedPage(progress.lastPageViewed);
          queryClient.setQueryData<NoteDetailResponse>(
            queryKeys.student.note(note.id),
            (current) =>
              current ? replaceNoteProgress(current, progress) : current,
          );
          queryClient.setQueriesData<NotesListResponse>(
            {
              queryKey: ["student", "notes", "list"],
            },
            (current) => replaceProgressInNotesList(current, note.id, progress),
          );
          queryClient.setQueryData<NotesTreeResponse>(
            queryKeys.student.notesTree(),
            (current) => replaceProgressInTree(current, note.id, progress),
          );
        })
        .catch(() => undefined);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [
    currentPage,
    note.id,
    progressMutation,
    queryClient,
    readerState,
    session,
    syncedPage,
  ]);

  async function startSession(startPage: number) {
    setReaderError(null);
    setReaderState("starting");
    setSession(null);
    setWatermarkPayload(null);
    setSessionStartPage(startPage);
    setCurrentPage(startPage);

    try {
      const nextSession = await createSessionMutation.mutateAsync(note.id);
      const nextWatermark = await getNoteWatermark(
        nextSession.noteViewSessionId,
        nextSession.noteViewToken,
      );

      setSession(nextSession);
      setWatermarkPayload(nextWatermark);
      setReaderState("ready");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The secure note session could not be created.";

      setReaderError(message);
      setReaderState(isNoteSessionErrorMessage(message) ? "expired" : "error");
    }
  }

  function handleViewerError(message: string) {
    setReaderError(message);
    setReaderState(isNoteSessionErrorMessage(message) ? "expired" : "error");
  }

  const previewPageCount = getOptionalNumber(
    session?.previewPageCount ?? note.access.previewPageCount,
  );
  const canResume = initialStartPage > 1;
  const isLocked = note.access.mode === "LOCKED";
  const plansHref = buildStudentPlansHref({
    intent: "notes",
    returnTo: `/student/notes/${note.id}`,
    source: isLocked ? "note-reader-locked" : "note-reader",
  });

  return (
    <section
      className={`rounded-[32px] ${focusMode ? "bg-[rgba(8,19,35,0.92)] p-3 sm:p-4" : "tc-panel p-6"}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p
              className="tc-kicker"
              style={{
                color: focusMode ? "var(--accent-glow)" : "var(--accent-student)",
              }}
            >
              Secure note reader
            </p>
            <h2
              className={`tc-display mt-3 text-2xl font-semibold tracking-tight ${focusMode ? "text-white" : "text-[color:var(--brand)]"}`}
            >
              {note.access.mode === "PREVIEW"
                ? "Preview session"
                : "Protected reading session"}
            </h2>
            <p
              className={`mt-3 max-w-3xl text-sm leading-6 ${focusMode ? "text-white/72" : "tc-muted"}`}
            >
              {note.access.mode === "PREVIEW"
                ? `This preview reader stays protected and respects the ${previewPageCount ?? "published"} preview-page limit.`
                : "Watermark overlays, no-store asset delivery, and backend progress syncing are active while you read."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {readerState === "ready" ? (
              <>
                <button
                  type="button"
                  onClick={() => setFocusMode(!focusMode)}
                  className="tc-button-secondary"
                >
                  {focusMode ? "Exit focus mode" : "Focus mode"}
                </button>
                <button
                  type="button"
                  onClick={() => void startSession(currentPage)}
                  className="tc-button-secondary"
                >
                  Refresh secure session
                </button>
              </>
            ) : null}
            <Link href={plansHref} className="tc-button-secondary">
              View plans
            </Link>
          </div>
        </div>

        {isLocked ? (
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <PremiumAccessCard
              badgeLabel="Premium note"
              description={accessDescriptor.description}
              hints={[
                "Secure note sessions only start after the backend confirms active note access.",
                "Preview limits, if any, still stay enforced by the published note access summary.",
              ]}
              intent="notes"
              primaryLabel="Unlock note access"
              returnTo={`/student/notes/${note.id}`}
              secondaryHref="/student/notes"
              secondaryLabel="Back to notes"
              source="note-reader-locked"
              title="This note is published, but the reader is entitlement-gated."
            />
            <div className="rounded-[28px] bg-[rgba(0,30,64,0.05)] p-5">
              <p className="tc-overline">What unlocks next</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--brand)]">
                Note access is now routed through the shared student plans and
                payment result flow so the reader can wait for a real
                entitlement refresh instead of assuming offline purchase state.
              </p>
            </div>
          </div>
        ) : null}

        {!isLocked && readerState === "idle" ? (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] bg-[rgba(255,255,255,0.82)] p-5">
              <p className="tc-overline">Read next</p>
              <h3 className="mt-3 text-xl font-semibold text-[color:var(--brand)]">
                {canResume
                  ? `Resume from page ${initialStartPage}`
                  : note.access.mode === "PREVIEW"
                    ? "Start the premium preview"
                    : "Start the protected reader"}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-6">
                {note.progress?.updatedAt
                  ? `Progress was last synced on ${new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(note.progress.updatedAt))}.`
                  : "Once a secure session starts, page progress syncs back to the backend so the reader can resume later."}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void startSession(initialStartPage)}
                  className="tc-button-primary"
                >
                  {canResume
                    ? `Resume from page ${initialStartPage}`
                    : note.access.mode === "PREVIEW"
                      ? "Start preview"
                      : "Start reading"}
                </button>
                <button
                  type="button"
                  onClick={() => void startSession(1)}
                  className="tc-button-secondary"
                >
                  Start from page 1
                </button>
              </div>
            </div>

            <div className="rounded-[28px] bg-[rgba(0,30,64,0.05)] p-5">
              <p className="tc-overline">Session rules</p>
              <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-[color:var(--brand)]">
                <p>The note view token stays in component memory only.</p>
                <p>Watermark metadata is pulled per secure session.</p>
                <p>PDF content is streamed with backend `no-store` headers.</p>
                {previewPageCount ? (
                  <p>The current access tier exposes {previewPageCount} preview pages.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {!isLocked && readerState === "starting" ? (
          <LoadingState
            title="Starting the secure reader"
            description="Creating a protected note session, resolving watermark data, and opening the PDF stream."
          />
        ) : null}

        {!isLocked && (readerState === "error" || readerState === "expired") ? (
          <ErrorState
            title={
              readerState === "expired"
                ? "The secure note session expired."
                : "The secure note session hit an error."
            }
            description={
              readerError ??
              "The session could not continue, so the reader is ready to request a fresh note token."
            }
            retryLabel="Start a new secure session"
            onRetry={() => void startSession(currentPage)}
          />
        ) : null}

        {!isLocked && readerState === "ready" && session ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">
                {session.accessMode === "PREVIEW" ? "Preview session" : "Full session"}
              </span>
              <span className="tc-stat-chip">Page {currentPage}</span>
              <span className="tc-stat-chip">
                Expires {formatExpiry(session.expiresAt)}
              </span>
              {progressMutation.isPending ? (
                <span className="tc-stat-chip">Saving progress...</span>
              ) : null}
            </div>

            <PdfCanvasViewer
              key={`${session.noteViewSessionId}:${sessionStartPage}`}
              initialPage={sessionStartPage}
              initialZoom={preferredZoom}
              noteViewSessionId={session.noteViewSessionId}
              noteViewToken={session.noteViewToken}
              onError={handleViewerError}
              onPageChange={(page) => setCurrentPage(page)}
              onZoomChange={setPreferredZoom}
              watermarkPayload={watermarkPayload}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
