"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  buildNoteProgressLabel,
  getNoteAccessDescriptor,
  getPublishedNote,
} from "@/lib/notes";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { SecureNoteReader } from "@/components/student/secure-note-reader";
import { useNoteReaderStore } from "@/stores";

export function StudentNoteReaderScreen({
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
          ctaLabel="Back to notes"
        />
      );
    }

    if (noteQuery.isError) {
      return (
        <ErrorState
          title="The note could not load."
          description="We couldn't open this note right now."
          onRetry={() => void noteQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title="Opening note"
        description="Loading your saved page and secure reader access."
      />
    );
  }

  const note = noteQuery.data;
  const accessDescriptor = getNoteAccessDescriptor(note.access);

  return (
    <div className="flex flex-col gap-3">
      <section className="tc-student-panel rounded-[20px] p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="tc-overline">Notes</p>
            <h1 className="mt-1 truncate text-xl font-semibold text-[color:var(--brand)] md:text-2xl">
              {note.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="tc-student-chip" data-tone="soft">
              {buildNoteProgressLabel(note)}
            </span>
            <span className="tc-student-chip" data-tone="accent">
              {accessDescriptor.label}
            </span>
            <Link href="/student/notes" className="tc-button-secondary">
              Back
            </Link>
          </div>
        </div>
      </section>

      <SecureNoteReader autoStart note={note} />
    </div>
  );
}
