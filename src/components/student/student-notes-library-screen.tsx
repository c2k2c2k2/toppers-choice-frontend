"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  filterTreeSubjectsByTrack,
  findTreeSubjectById,
  findTreeTopicById,
  getPublishedNotes,
  getPublishedNotesTree,
  matchesNoteMedium,
  type NoteSummary,
} from "@/lib/notes";
import {
  buildStudentCatalogSnapshot,
  getStudentCatalog,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { StudentNoteCard } from "@/components/student/student-note-card";
import { StudentNotesTree } from "@/components/student/student-notes-tree";
import { useStudentShellStore } from "@/stores";

type AccessFilter = "all" | "available" | "locked" | "preview";

function matchesAccessFilter(
  accessFilter: AccessFilter,
  note: NoteSummary,
) {
  switch (accessFilter) {
    case "available":
      return note.access.mode === "FULL" || note.access.mode === "PREVIEW";
    case "preview":
      return note.access.mode === "PREVIEW";
    case "locked":
      return note.access.mode === "LOCKED";
    default:
      return true;
  }
}

function replaceSearchParams(
  pathname: string,
  currentSearchParams: URLSearchParams,
  nextValues: Record<string, string | null>,
) {
  const searchParams = new URLSearchParams(currentSearchParams.toString());

  for (const [key, value] of Object.entries(nextValues)) {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function StudentNotesLibraryScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const notesListRef = useRef<HTMLDivElement | null>(null);
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const requestedSubjectId = searchParams.get("subject");
  const requestedTopicId = searchParams.get("topic");

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });

  const treeQuery = useAuthenticatedQuery({
    queryFn: getPublishedNotesTree,
    queryKey: queryKeys.student.notesTree(),
    staleTime: 60_000,
  });

  const catalog = catalogQuery.data;
  const catalogSnapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
      examTrackCode: activeExamTrackCode,
      mediumCode: activeMediumCode,
    })
    : null;
  const selectedTrackId = catalogSnapshot?.selectedTrack?.id ?? null;
  const selectedMediumId = catalogSnapshot?.selectedMedium?.id ?? null;
  const visibleSubjects = treeQuery.data
    ? filterTreeSubjectsByTrack(treeQuery.data.subjects, selectedTrackId)
    : [];
  const selectedSubject = findTreeSubjectById(visibleSubjects, requestedSubjectId);
  const selectedTopic = selectedSubject
    ? findTreeTopicById(selectedSubject.topics, requestedTopicId)
    : null;

  function updateSelection(
    nextValues: Record<string, string | null>,
    options: {
      scrollToNotes?: boolean;
    } = {},
  ) {
    const href = replaceSearchParams(
      pathname,
      new URLSearchParams(searchParams.toString()),
      nextValues,
    );

    startTransition(() => {
      router.replace(href, { scroll: false });
    });

    if (options.scrollToNotes) {
      window.setTimeout(() => {
        notesListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    }
  }

  const notesQuery = useAuthenticatedQuery({
    enabled: Boolean(catalogSnapshot),
    queryFn: (accessToken) =>
      getPublishedNotes(accessToken, {
        search: deferredSearchValue || null,
        subjectId: requestedSubjectId,
        topicId: requestedTopicId,
      }),
    queryKey: queryKeys.student.notesList({
      mediumId: selectedMediumId,
      search: deferredSearchValue || null,
      subjectId: requestedSubjectId,
      topicId: requestedTopicId,
    }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!catalogSnapshot?.selectedTrack?.code) {
      return;
    }

    if (!activeExamTrackCode || activeExamTrackCode !== catalogSnapshot.selectedTrack.code) {
      setActiveExamTrackCode(catalogSnapshot.selectedTrack.code);
    }
  }, [
    activeExamTrackCode,
    catalogSnapshot?.selectedTrack?.code,
    setActiveExamTrackCode,
  ]);

  useEffect(() => {
    if (!catalogSnapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== catalogSnapshot.selectedMedium.code) {
      setActiveMediumCode(catalogSnapshot.selectedMedium.code);
    }
  }, [
    activeMediumCode,
    catalogSnapshot?.selectedMedium?.code,
    setActiveMediumCode,
  ]);

  useEffect(() => {
    if (!visibleSubjects.length) {
      return;
    }

    if (requestedSubjectId && !selectedSubject) {
      const href = replaceSearchParams(
        pathname,
        new URLSearchParams(searchParams.toString()),
        {
          subject: null,
          topic: null,
        },
      );

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
      return;
    }

    if (requestedTopicId && selectedSubject && !selectedTopic) {
      const href = replaceSearchParams(
        pathname,
        new URLSearchParams(searchParams.toString()),
        {
          topic: null,
        },
      );

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }
  }, [
    pathname,
    requestedSubjectId,
    requestedTopicId,
    router,
    searchParams,
    selectedSubject,
    selectedTopic,
    visibleSubjects.length,
  ]);

  if (catalogQuery.isError || treeQuery.isError || notesQuery.isError) {
    return (
      <ErrorState
        title="The notes library could not load."
        description="Please try again."
        onRetry={() => {
          void catalogQuery.refetch();
          void treeQuery.refetch();
          void notesQuery.refetch();
        }}
      />
    );
  }

  if (
    catalogQuery.isLoading ||
    treeQuery.isLoading ||
    notesQuery.isLoading ||
    !catalogSnapshot ||
    !treeQuery.data ||
    !notesQuery.data
  ) {
    return (
      <LoadingState
        title="Preparing the notes library"
        description="Loading notes."
      />
    );
  }

  const contextualNotes = notesQuery.data.items.filter((note) => {
    return (
      (!selectedTrackId || note.subject.examTrackId === selectedTrackId) &&
      matchesNoteMedium(note, selectedMediumId)
    );
  });
  const filteredNotes = contextualNotes.filter((note) =>
    matchesAccessFilter(accessFilter, note),
  );

  const availableCount = contextualNotes.filter(
    (note) => note.access.mode === "FULL" || note.access.mode === "PREVIEW",
  ).length;
  const previewCount = contextualNotes.filter(
    (note) => note.access.mode === "PREVIEW",
  ).length;
  const lockedCount = contextualNotes.filter(
    (note) => note.access.mode === "LOCKED",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tc-overline">Notes</p>
            <h1 className="mt-2 text-xl font-semibold text-[color:var(--brand)] md:text-2xl">
              {selectedTopic?.name ?? selectedSubject?.name ?? "All notes"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="tc-student-chip" data-tone="soft">
              {filteredNotes.length} notes
            </span>
            <span className="tc-student-chip" data-tone="accent">
              {availableCount} ready
            </span>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
          <label className="tc-form-field">
            <span className="tc-form-label">Search notes</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="tc-input"
              placeholder="Search revision packs, marathon notes, polity..."
            />
          </label>

          <div className="space-y-2">
            <p className="tc-form-label">Show</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", `All (${contextualNotes.length})`],
                  ["available", `Ready now (${availableCount})`],
                  ["preview", `Preview (${previewCount})`],
                  ["locked", `Premium (${lockedCount})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="tc-filter-chip"
                  data-active={accessFilter === value}
                  onClick={() => setAccessFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="tc-student-panel order-2 rounded-[20px] p-4 xl:order-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tc-overline">Filter</p>
              <h2 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                Subjects and topics
              </h2>
            </div>
            <Link href="/student/catalog" className="tc-button-secondary">
              Catalog
            </Link>
          </div>

          <div className="mt-4">
            <StudentNotesTree
              activeSubjectId={requestedSubjectId}
              activeTopicId={requestedTopicId}
              mediumId={selectedMediumId}
              onSelectAll={() =>
                updateSelection({
                  subject: null,
                  topic: null,
                }, {
                  scrollToNotes: true,
                })
              }
              onSelectSubject={(subjectId) =>
                updateSelection({
                  subject: subjectId,
                  topic: null,
                }, {
                  scrollToNotes: true,
                })
              }
              onSelectTopic={(subjectId, topicId) =>
                updateSelection({
                  subject: subjectId,
                  topic: topicId,
                }, {
                  scrollToNotes: true,
                })
              }
              subjects={visibleSubjects}
            />
          </div>
        </aside>

        <div
          ref={notesListRef}
          className="order-1 flex scroll-mt-4 flex-col gap-3 xl:order-2"
        >
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <StudentNoteCard
                key={note.id}
                href={`/student/notes/${note.id}/read`}
                note={note}
              />
            ))
          ) : (
            <EmptyState
              eyebrow="Notes"
              title="No published notes match this selection."
              description="Try another topic, search, or access filter."
              ctaHref="/student/notes"
              ctaLabel="Reset filters"
            />
          )}
        </div>
      </section>
    </div>
  );
}
