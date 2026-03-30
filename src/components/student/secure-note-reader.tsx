"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  createNoteBookmark,
  createNoteViewSession,
  deleteNoteBookmark,
  getNoteBookmarks,
  getNoteAccessDescriptor,
  getNoteWatermark,
  getOptionalNumber,
  getPublishedNoteIndex,
  getReaderStartPage,
  isNoteSessionErrorMessage,
  updateNoteProgress,
  type NoteBookmark,
  type NoteDetailResponse,
  type NoteIndexEntry,
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
import { MarathiText } from "@/components/primitives/marathi-text";
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

type ReaderActionIcon =
  | "bookmark"
  | "bookmarks"
  | "close"
  | "expand"
  | "index"
  | "refresh";

function ReaderActionGlyph({
  icon,
}: Readonly<{
  icon: ReaderActionIcon;
}>) {
  if (icon === "bookmark" || icon === "bookmarks") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        {icon === "bookmark" ? (
          <path d="M7 5.75A1.75 1.75 0 0 1 8.75 4h6.5A1.75 1.75 0 0 1 17 5.75V20l-5-3-5 3z" />
        ) : (
          <>
            <path d="M6 7.25A1.25 1.25 0 0 1 7.25 6h5.5A1.25 1.25 0 0 1 14 7.25V18l-4-2.4L6 18z" />
            <path d="M13 5.5h3.75A1.25 1.25 0 0 1 18 6.75V17l-3-1.8" />
          </>
        )}
      </svg>
    );
  }

  if (icon === "close") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M6 6L18 18" />
        <path d="M18 6L6 18" />
      </svg>
    );
  }

  if (icon === "expand") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M8 4H4v4" />
        <path d="M16 4h4v4" />
        <path d="M8 20H4v-4" />
        <path d="M16 20h4v-4" />
        <path d="M4 8l5-5" />
        <path d="M20 8l-5-5" />
        <path d="M4 16l5 5" />
        <path d="M20 16l-5 5" />
      </svg>
    );
  }

  if (icon === "index") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M8 7h11" />
        <path d="M8 12h11" />
        <path d="M8 17h11" />
        <path d="M4.5 7h.01" />
        <path d="M4.5 12h.01" />
        <path d="M4.5 17h.01" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}

function ReaderActionButton({
  active = false,
  disabled = false,
  icon,
  inverted = false,
  label,
  onClick,
}: Readonly<{
  active?: boolean;
  disabled?: boolean;
  icon: ReaderActionIcon;
  inverted?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-[18px] border text-sm transition",
        inverted
          ? [
              active
                ? "border-white/22 bg-white/18 text-white"
                : "border-white/12 bg-white/10 text-white/88",
              "hover:-translate-y-0.5 hover:bg-white/16 disabled:translate-y-0 disabled:bg-white/8 disabled:text-white/45",
            ].join(" ")
          : [
              active
                ? "border-[rgba(0,51,102,0.18)] bg-[rgba(0,51,102,0.1)] text-[color:var(--brand)]"
                : "border-[rgba(0,30,64,0.08)] bg-white/90 text-[color:var(--brand)]",
              "shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[rgba(0,51,102,0.18)] hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45",
            ].join(" "),
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <ReaderActionGlyph icon={icon} />
      <span className="sr-only">{label}</span>
    </button>
  );
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
  const [activePanel, setActivePanel] = useState<"bookmarks" | "index" | null>(
    "index",
  );
  const [currentPage, setCurrentPage] = useState(initialStartPage);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerState, setReaderState] = useState<ReaderState>("idle");
  const [session, setSession] = useState<NoteViewSessionResponse | null>(null);
  const [sessionStartPage, setSessionStartPage] = useState(initialStartPage);
  const [syncedPage, setSyncedPage] = useState(
    getOptionalNumber(note.progress?.lastPageViewed) ?? 0,
  );
  const [watermarkPayload, setWatermarkPayload] =
    useState<NoteWatermarkResponse | null>(null);
  const isLocked = note.access.mode === "LOCKED";

  const noteIndexQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getPublishedNoteIndex(note.id, accessToken),
    queryKey: queryKeys.student.noteIndex(note.id),
    staleTime: 60_000,
  });

  const bookmarksQuery = useAuthenticatedQuery({
    enabled: !isLocked,
    queryFn: (accessToken) => getNoteBookmarks(note.id, accessToken),
    queryKey: queryKeys.student.noteBookmarks(note.id),
    staleTime: 15_000,
  });

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

  const createBookmarkMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        label?: string;
        noteIndexEntryId?: string;
        pageNumber: number;
      },
      accessToken: string,
    ) => createNoteBookmark(note.id, input, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.noteBookmarks(note.id),
      });
    },
  });

  const deleteBookmarkMutation = useAuthenticatedMutation({
    mutationFn: (bookmark: NoteBookmark, accessToken: string) =>
      deleteNoteBookmark(note.id, bookmark.id, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.noteBookmarks(note.id),
      });
    },
  });

  useEffect(() => {
    setLastOpenedNoteId(note.id);
  }, [note.id, setLastOpenedNoteId]);

  useEffect(() => {
    const updateViewportState = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    return () => window.removeEventListener("resize", updateViewportState);
  }, []);

  useEffect(() => {
    const shouldShowBottomNav = readerState !== "ready";
    setBottomNavVisible(shouldShowBottomNav);

    return () => setBottomNavVisible(true);
  }, [readerState, setBottomNavVisible]);

  useEffect(() => {
    if (readerState === "ready" && isMobileViewport) {
      setFocusMode(true);
    }
  }, [isMobileViewport, readerState, setFocusMode]);

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
          : "The note session could not be started.";

      setReaderError(message);
      setReaderState(isNoteSessionErrorMessage(message) ? "expired" : "error");
    }
  }

  function handleViewerError(message: string) {
    setReaderError(message);
    setReaderState(isNoteSessionErrorMessage(message) ? "expired" : "error");
  }

  function handleJumpToPage(page: number) {
    const nextPage = Math.max(1, Math.trunc(page));
    setCurrentPage(nextPage);
    setActivePanel(null);

    if (readerState === "idle") {
      void startSession(nextPage);
    }
  }

  const canResume = initialStartPage > 1;
  const plansHref = buildStudentPlansHref({
    intent: "notes",
    returnTo: `/student/notes/${note.id}`,
    source: isLocked ? "note-reader-locked" : "note-reader",
  });
  const indexItems = useMemo(
    () => noteIndexQuery.data?.items ?? [],
    [noteIndexQuery.data?.items],
  );
  const indexEntriesById = useMemo(
    () => new Map(indexItems.map((entry) => [entry.id, entry])),
    [indexItems],
  );
  const nearestIndexEntry = useMemo(() => {
    const sorted = [...indexItems]
      .filter((entry) => entry.pageNumber <= currentPage)
      .sort((left, right) => right.pageNumber - left.pageNumber);
    return sorted[0] ?? null;
  }, [currentPage, indexItems]);

  function buildBookmarkLabel(entry: NoteIndexEntry | null) {
    if (!entry) {
      return `Page ${currentPage}`;
    }

    return [entry.serialLabel, entry.title].filter(Boolean).join(" ");
  }

  function handleTogglePanel(panel: "bookmarks" | "index") {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  function handleSaveBookmark() {
    createBookmarkMutation.mutate({
      label: buildBookmarkLabel(nearestIndexEntry),
      noteIndexEntryId: nearestIndexEntry?.id,
      pageNumber: currentPage,
    });
  }

  function renderIndexEntryTitle(entry: NoteIndexEntry) {
    return (
      <div
        className="font-semibold text-[color:var(--brand)]"
        style={{ paddingLeft: `${entry.indentLevel * 0.75}rem` }}
      >
        {entry.serialLabel ? <span>{entry.serialLabel} </span> : null}
        <MarathiText as="span" text={entry.title} fontHint={entry.titleFontHint} />
      </div>
    );
  }

  function renderIndexPanel() {
    if (noteIndexQuery.isLoading) {
      return <p className="text-sm text-[color:var(--muted)]">Loading note index...</p>;
    }

    if (noteIndexQuery.isError) {
      return (
        <p className="text-sm text-[color:var(--muted)]">
          The note index could not be loaded right now.
        </p>
      );
    }

    if (indexItems.length === 0) {
      return (
        <p className="text-sm text-[color:var(--muted)]">
          The admin has not added an index for this note yet.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {indexItems.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => handleJumpToPage(entry.pageNumber)}
            className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/90 px-4 py-3 text-left transition hover:border-[rgba(0,51,102,0.2)] hover:bg-white"
          >
            {renderIndexEntryTitle(entry)}
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Page {entry.pageNumber}
            </p>
          </button>
        ))}
      </div>
    );
  }

  function renderBookmarkPanel() {
    if (isLocked) {
      return (
        <p className="text-sm text-[color:var(--muted)]">
          Unlock the note to add bookmarks.
        </p>
      );
    }

    if (bookmarksQuery.isLoading) {
      return <p className="text-sm text-[color:var(--muted)]">Loading bookmarks...</p>;
    }

    if (bookmarksQuery.isError) {
      return (
        <p className="text-sm text-[color:var(--muted)]">
          Bookmarks could not be loaded right now.
        </p>
      );
    }

    if ((bookmarksQuery.data?.items.length ?? 0) === 0) {
      return (
        <p className="text-sm text-[color:var(--muted)]">
          Add a bookmark while reading to come back quickly.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {bookmarksQuery.data?.items.map((bookmark) => (
          <div
            key={bookmark.id}
            className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/90 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {bookmark.noteIndexEntryId &&
                indexEntriesById.has(bookmark.noteIndexEntryId) ? (
                  renderIndexEntryTitle(indexEntriesById.get(bookmark.noteIndexEntryId)!)
                ) : (
                  <p className="font-semibold text-[color:var(--brand)]">
                    {bookmark.label || `Page ${bookmark.pageNumber}`}
                  </p>
                )}
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Page {bookmark.pageNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="tc-button-secondary px-4 py-2"
                  onClick={() => handleJumpToPage(bookmark.pageNumber)}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="tc-button-secondary px-4 py-2"
                  disabled={deleteBookmarkMutation.isPending}
                  onClick={() => deleteBookmarkMutation.mutate(bookmark)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const panelShellClasses =
    "tc-student-card-muted rounded-[24px] p-4";

  return (
    <section
      className={
        focusMode && readerState === "ready"
          ? "fixed inset-0 z-50 bg-[rgba(7,17,31,0.98)] p-3 sm:p-4"
          : "tc-student-panel rounded-[32px] p-4 sm:p-5 lg:p-6"
      }
    >
      <div
        className={`flex flex-col gap-6 ${focusMode && readerState === "ready" ? "h-full" : ""}`}
      >
        {!(focusMode && readerState === "ready") ? (
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Note reader
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
                {note.access.mode === "PREVIEW" ? "Preview reader" : "Full reader"}
              </h2>
              <p className="tc-muted mt-3 max-w-3xl text-sm leading-6">
                {note.access.mode === "PREVIEW"
                  ? `Open the protected preview and continue from page ${initialStartPage}.`
                  : "Open the note in a clean reading mode with progress, index navigation, and bookmarks."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {readerState === "ready" ? (
                <>
                  <ReaderActionButton
                    icon="expand"
                    label="Open zen mode"
                    onClick={() => setFocusMode(true)}
                  />
                  <ReaderActionButton
                    icon="refresh"
                    label="Refresh reader session"
                    onClick={() => void startSession(currentPage)}
                  />
                </>
              ) : null}
              {note.access.requiresEntitlement ? (
                <Link href={plansHref} className="tc-button-secondary">
                  View plans
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-[24px] bg-white/8 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Zen reader
              </p>
              <p className="truncate text-sm font-semibold">
                {nearestIndexEntry?.title || note.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
                Page {currentPage}
              </span>
              <ReaderActionButton
                active={activePanel === "index"}
                icon="index"
                inverted
                label="Toggle note index"
                onClick={() => handleTogglePanel("index")}
              />
              <ReaderActionButton
                active={activePanel === "bookmarks"}
                icon="bookmarks"
                inverted
                label="Toggle bookmarks"
                onClick={() => handleTogglePanel("bookmarks")}
              />
              <ReaderActionButton
                disabled={createBookmarkMutation.isPending}
                icon="bookmark"
                inverted
                label="Save this page"
                onClick={handleSaveBookmark}
              />
              <ReaderActionButton
                icon="close"
                inverted
                label="Exit zen mode"
                onClick={() => setFocusMode(false)}
              />
            </div>
          </div>
        )}

        {isLocked ? (
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <PremiumAccessCard
              badgeLabel="Premium note"
              description={accessDescriptor.description}
              hints={[
                "Preview access, if configured, will appear automatically for this note.",
                "The note reader opens after your plan access refreshes.",
              ]}
              intent="notes"
              primaryLabel="Unlock note access"
              returnTo={`/student/notes/${note.id}`}
              secondaryHref="/student/notes"
              secondaryLabel="Back to notes"
              source="note-reader-locked"
              title="This note needs an active plan before full reading starts."
            />
            <div className="rounded-[28px] bg-[rgba(0,30,64,0.05)] p-5">
              <p className="tc-overline">Index preview</p>
              <div className="mt-3">{renderIndexPanel()}</div>
            </div>
          </div>
        ) : null}

        {!isLocked && readerState === "idle" ? (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] bg-[rgba(255,255,255,0.82)] p-5">
              <p className="tc-overline">Continue reading</p>
              <h3 className="mt-3 text-xl font-semibold text-[color:var(--brand)]">
                {canResume
                  ? `Resume from page ${initialStartPage}`
                  : note.access.mode === "PREVIEW"
                    ? "Start the preview"
                    : "Start reading"}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-6">
                {note.progress?.updatedAt
                  ? `Last progress sync: ${new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(note.progress.updatedAt))}.`
                  : "Progress is saved automatically while you move through the note."}
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
              <p className="tc-overline">Quick map</p>
              <div className="mt-3">{renderIndexPanel()}</div>
            </div>
          </div>
        ) : null}

        {!isLocked && readerState === "starting" ? (
          <LoadingState
            title="Opening the note"
            description="Creating the reader session and preparing the PDF."
          />
        ) : null}

        {!isLocked && (readerState === "error" || readerState === "expired") ? (
          <ErrorState
            title={
              readerState === "expired"
                ? "The note session expired."
                : "The note could not keep reading."
            }
            description={
              readerError ??
              "Start a fresh session to continue from your current page."
            }
            retryLabel="Start again"
            onRetry={() => void startSession(currentPage)}
          />
        ) : null}

        {!isLocked && readerState === "ready" && session ? (
          focusMode ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {activePanel ? (
                <div className="mb-3 max-h-[32vh] overflow-auto rounded-[24px] bg-white/92 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="tc-overline">
                      {activePanel === "index" ? "Note index" : "Bookmarks"}
                    </p>
                    <ReaderActionButton
                      icon="close"
                      label="Hide reader panel"
                      onClick={() => setActivePanel(null)}
                    />
                  </div>
                  {activePanel === "index" ? renderIndexPanel() : renderBookmarkPanel()}
                </div>
              ) : null}

              <div className="min-h-0 flex-1">
                <PdfCanvasViewer
                  key={`${session.noteViewSessionId}:${sessionStartPage}`}
                  gestureDirection={isMobileViewport ? "vertical" : "horizontal"}
                  initialPage={sessionStartPage}
                  initialZoom={preferredZoom}
                  noteViewSessionId={session.noteViewSessionId}
                  noteViewToken={session.noteViewToken}
                  onError={handleViewerError}
                  onPageChange={(page) => setCurrentPage(page)}
                  onZoomChange={setPreferredZoom}
                  requestedPage={currentPage}
                  shellClassName="h-full min-h-[calc(100vh-10rem)] border-0 bg-[linear-gradient(180deg,#08111f_0%,#040914_100%)] p-0"
                  showToolbar={false}
                  watermarkPayload={watermarkPayload}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/70">
                <p>
                  {isMobileViewport
                    ? "Swipe up or down to move between pages."
                    : "Use the index or keyboard arrows to move through pages."}
                </p>
                <p>{progressMutation.isPending ? "Saving progress..." : "Saved"}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-[28px] border border-[rgba(0,30,64,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,247,250,0.96)_100%)] p-4 shadow-[var(--shadow-soft)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tc-stat-chip">
                      {session.accessMode === "PREVIEW" ? "Preview" : "Full note"}
                    </span>
                    <span className="tc-stat-chip">Page {currentPage}</span>
                    <span className="tc-stat-chip">
                      Expires {formatExpiry(session.expiresAt)}
                    </span>
                    {progressMutation.isPending ? (
                      <span className="tc-stat-chip">Saving progress...</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ReaderActionButton
                      active={activePanel === "index"}
                      icon="index"
                      label="Toggle note index"
                      onClick={() => handleTogglePanel("index")}
                    />
                    <ReaderActionButton
                      active={activePanel === "bookmarks"}
                      icon="bookmarks"
                      label="Toggle bookmarks"
                      onClick={() => handleTogglePanel("bookmarks")}
                    />
                    <ReaderActionButton
                      disabled={createBookmarkMutation.isPending}
                      icon="bookmark"
                      label="Save this page"
                      onClick={handleSaveBookmark}
                    />
                    <ReaderActionButton
                      icon="expand"
                      label="Open zen mode"
                      onClick={() => setFocusMode(true)}
                    />
                    <ReaderActionButton
                      icon="refresh"
                      label="Refresh reader session"
                      onClick={() => void startSession(currentPage)}
                    />
                  </div>
                </div>

                {nearestIndexEntry ? (
                  <div className="mt-4 rounded-[20px] border border-[rgba(0,30,64,0.06)] bg-white/78 px-4 py-3">
                    <p className="tc-overline">Reading now</p>
                    <div className="mt-2 text-sm font-semibold text-[color:var(--brand)]">
                      {renderIndexEntryTitle(nearestIndexEntry)}
                    </div>
                  </div>
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
                requestedPage={currentPage}
                watermarkPayload={watermarkPayload}
              />

              {activePanel ? (
                <div className={panelShellClasses}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="tc-overline">
                        {activePanel === "bookmarks" ? "Bookmarks" : "Note index"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {activePanel === "bookmarks"
                          ? "Jump back to the pages you marked during this reading session."
                          : "Use the topic map to jump directly to the right chapter or section."}
                      </p>
                    </div>
                    <ReaderActionButton
                      icon="close"
                      label="Hide reader panel"
                      onClick={() => setActivePanel(null)}
                    />
                  </div>
                  <div className="mt-4">
                    {activePanel === "bookmarks" ? renderBookmarkPanel() : renderIndexPanel()}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[rgba(0,30,64,0.12)] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-sm text-[color:var(--muted)]">
                  Use the compact actions above to open the note index, bookmarks, or zen mode without squeezing the page.
                </div>
              )}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
