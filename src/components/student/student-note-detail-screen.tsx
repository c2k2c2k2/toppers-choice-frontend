"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  getNoteAccessDescriptor,
  getOptionalNumber,
  getPublishedNote,
} from "@/lib/notes";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { SecureNoteReader } from "@/components/student/secure-note-reader";
import { useNoteReaderStore } from "@/stores";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudentNoteDetailScreen({
  noteId,
}: Readonly<{
  noteId: string;
}>) {
  const setLastOpenedNoteId = useNoteReaderStore(
    (state) => state.setLastOpenedNoteId,
  );
  const noteQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getPublishedNote(noteId, accessToken),
    queryKey: queryKeys.student.note(noteId),
    staleTime: 30_000,
  });

  useEffect(() => {
    setLastOpenedNoteId(noteId);
  }, [noteId, setLastOpenedNoteId]);

  if (noteQuery.isLoading || !noteQuery.data) {
    if (noteQuery.isError && isApiError(noteQuery.error) && noteQuery.error.status === 404) {
      return (
        <EmptyState
          eyebrow="Note not found"
          title="That note is not in the published library."
          description="The selected note could not be found in the current published library."
          ctaHref="/student/notes"
          ctaLabel="Back to notes library"
        />
      );
    }

    if (noteQuery.isError) {
      return (
        <ErrorState
          title="The note detail could not load."
          description="We couldn't finish loading this note right now."
          onRetry={() => void noteQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title="Preparing the note detail"
        description="Loading the note summary, access status, and latest progress."
      />
    );
  }

  const note = noteQuery.data;
  const accessDescriptor = getNoteAccessDescriptor(note.access);
  const previewPageCount = getOptionalNumber(note.access.previewPageCount);

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Note detail
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {note.title}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {note.description ?? note.shortDescription ?? accessDescriptor.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">{note.subject.name}</span>
              <span className="tc-stat-chip">{accessDescriptor.label}</span>
              <span className="tc-stat-chip">{note.pageCount} pages</span>
              {previewPageCount ? (
                <span className="tc-stat-chip">
                  {previewPageCount} preview pages
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Last synced page</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {getOptionalNumber(note.progress?.lastPageViewed) ?? 0}
              </p>
              <p className="mt-2 text-sm text-white/72">
                updated {formatTimestamp(note.progress?.updatedAt ?? null)}
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Completion</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {getOptionalNumber(note.progress?.completionPercent) ?? 0}%
              </p>
              <p className="mt-2 text-sm text-white/72">
                access state: {accessDescriptor.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[21rem_minmax(0,1fr)] 2xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="tc-student-panel rounded-[28px] p-5 lg:p-6 xl:sticky xl:top-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Note summary
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                What you have in this note
              </h2>
            </div>
            <Link href="/student/notes" className="tc-button-secondary w-fit">
              Back to notes
            </Link>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="tc-student-card rounded-[24px] p-5">
              <p className="tc-overline">Subject</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                {note.subject.name}
              </p>
              <p className="tc-muted mt-2 text-sm leading-6">
                {note.topics.length > 0
                  ? note.topics.map((topic) => topic.name).join(", ")
                  : "This note is currently attached at the subject level."}
              </p>
            </div>

            <div className="tc-student-card rounded-[24px] p-5">
              <p className="tc-overline">Reading progress</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[20px] bg-white/72 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Last page
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                    {getOptionalNumber(note.progress?.lastPageViewed) ?? 0}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white/72 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Max reached
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                    {getOptionalNumber(note.progress?.maxPageViewed) ?? 0}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white/72 px-4 py-3 sm:col-span-2 xl:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Last viewed
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--brand)]">
                    {formatTimestamp(note.progress?.lastViewedAt ?? null)}
                  </p>
                </div>
              </div>
            </div>

            <div className="tc-student-card rounded-[24px] p-5">
              <p className="tc-overline">Reader tools</p>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-[color:var(--brand)]">
                <p>Use zen mode on mobile for a distraction-free page view.</p>
                <p>Open the index to jump straight to a chapter or topic.</p>
                <p>Save bookmarks whenever you want to return quickly.</p>
              </div>
            </div>
          </div>
        </aside>

        <SecureNoteReader note={note} />
      </section>
    </div>
  );
}
