"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
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
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
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

  function updateSelection(nextValues: Record<string, string | null>) {
    const href = replaceSearchParams(
      pathname,
      new URLSearchParams(searchParams.toString()),
      nextValues,
    );

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
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
        description="We couldn't finish combining the student study context, note tree, and published note list from the backend."
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
        description="Loading the active student context, note discovery tree, and reader-ready note summaries."
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
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Student notes
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Discover by subject and topic, then open a secure reader only when needed.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              The library now combines the active student track, protected note
              access state, preview handling, and tree-based discovery into one
              mobile-first surface.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(catalogSnapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {getMediumLabel(catalogSnapshot.selectedMedium)}
              </span>
              <span className="tc-stat-chip">
                {selectedTopic?.name ?? selectedSubject?.name ?? "All subjects"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Visible notes</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {filteredNotes.length}
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Ready now</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {availableCount}
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Previewable</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {previewCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="tc-panel rounded-[28px] p-6">
        <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
          <label className="tc-form-field">
            <span className="tc-form-label">Search notes</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="tc-input"
              placeholder="Search revision packs, marathon notes, polity..."
            />
          </label>

          <div className="space-y-3">
            <p className="tc-form-label">Access filter</p>
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="tc-panel rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Notes tree
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Follow the published subject map
              </h2>
            </div>
            <Link href="/student/catalog" className="tc-button-secondary">
              Change context
            </Link>
          </div>

          <div className="mt-6">
            <StudentNotesTree
              activeSubjectId={requestedSubjectId}
              activeTopicId={requestedTopicId}
              mediumId={selectedMediumId}
              onSelectAll={() =>
                updateSelection({
                  subject: null,
                  topic: null,
                })
              }
              onSelectSubject={(subjectId) =>
                updateSelection({
                  subject: subjectId,
                  topic: null,
                })
              }
              onSelectTopic={(subjectId, topicId) =>
                updateSelection({
                  subject: subjectId,
                  topic: topicId,
                })
              }
              subjects={visibleSubjects}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <StudentNoteCard
                key={note.id}
                href={`/student/notes/${note.id}`}
                note={note}
              />
            ))
          ) : (
            <EmptyState
              eyebrow="Notes empty state"
              title="No published notes match this selection."
              description="The notes library is live, but the current subject, topic, search, or access filter combination did not return any note summaries."
              ctaHref="/student/notes"
              ctaLabel="Reset library filters"
            />
          )}
        </div>
      </section>
    </div>
  );
}
