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
  buildStudentCatalogSnapshot,
  buildSubjectNotesHref,
  countTopics,
  flattenTopicTree,
  getStudentCatalog,
  getTrackLabel,
  type StudentSubject,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { useStudentShellStore } from "@/stores";

function matchesSubjectSearch(subject: StudentSubject, value: string) {
  if (!value) {
    return true;
  }

  const normalized = value.toLowerCase();
  const topicNames = flattenTopicTree(subject.topics)
    .map((topic: StudentSubject["topics"][number]) => topic.name.toLowerCase())
    .join(" ");

  return [
    subject.name,
    topicNames,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
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

function SubjectTopicCapsules({
  subject,
}: Readonly<{
  subject: StudentSubject;
}>) {
  const topics = flattenTopicTree(subject.topics);
  const visibleTopics = topics.slice(0, 3);
  const remainingCount = Math.max(0, topics.length - visibleTopics.length);

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {visibleTopics.map((topic) => (
        <span key={topic.id} className="tc-student-chip">
          {topic.name}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="tc-muted text-xs font-semibold">
          ... and {remainingCount} more
        </span>
      ) : null}
    </div>
  );
}

export function StudentCatalogScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
    setLastCatalogSubjectSlug,
  } = useStudentShellStore();
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const requestedTrack = searchParams.get("track");

  const catalogQuery = useAuthenticatedQuery({
    queryKey: queryKeys.student.catalog(),
    queryFn: getStudentCatalog,
    staleTime: 60_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: requestedTrack ?? activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;

  useEffect(() => {
    if (!snapshot?.selectedTrack?.code) {
      return;
    }

    if (!activeExamTrackCode || activeExamTrackCode !== snapshot.selectedTrack.code) {
      setActiveExamTrackCode(snapshot.selectedTrack.code);
    }
  }, [activeExamTrackCode, setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (!snapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== snapshot.selectedMedium.code) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  if (catalogQuery.isError) {
    return (
      <ErrorState
        title="The catalog could not load."
        description="Please try again."
        onRetry={() => void catalogQuery.refetch()}
      />
    );
  }

  if (catalogQuery.isLoading || !catalog || !snapshot) {
    return (
      <LoadingState
        title="Preparing the catalog"
        description="Loading your subjects."
      />
    );
  }

  const filteredSubjects = snapshot.subjects.filter((subject) =>
    matchesSubjectSearch(subject, deferredSearchValue),
  );

  function updateFilters(nextValues: Record<string, string | null>) {
    const href = replaceSearchParams(
      pathname,
      new URLSearchParams(searchParams.toString()),
      nextValues,
    );

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="tc-overline">Exam track</p>
              <span className="tc-student-chip" data-tone="soft">
                {filteredSubjects.length} subjects
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {catalog.examTracks.length > 0 ? (
                catalog.examTracks.map((examTrack) => (
                  <button
                    key={examTrack.id}
                    type="button"
                    className="tc-filter-chip"
                    data-active={snapshot.selectedTrack?.id === examTrack.id}
                    onClick={() => {
                      setActiveExamTrackCode(examTrack.code);
                      updateFilters({ medium: null, track: examTrack.code });
                    }}
                  >
                    {getTrackLabel(examTrack)}
                  </button>
                ))
              ) : (
                <span className="tc-student-chip" data-tone="soft">
                  No tracks yet
                </span>
              )}
            </div>
          </div>

          <label className="tc-form-field">
            <span className="tc-form-label">Search subjects or topics</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="tc-input"
              placeholder="Search history, polity, grammar, essays..."
            />
          </label>
        </div>
      </section>

      {filteredSubjects.length > 0 ? (
        <section className="grid gap-3 xl:grid-cols-2">
          {filteredSubjects.map((subject) => (
            <Link
              key={subject.id}
              href={buildSubjectNotesHref(subject, {
                examTrackCode: snapshot.selectedTrack?.code ?? null,
                mediumCode: snapshot.selectedMedium?.code ?? null,
              })}
              onClick={() => setLastCatalogSubjectSlug(subject.slug)}
              className="tc-student-card rounded-[18px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[color:var(--brand)]">
                  {subject.name}
                </h2>
                <span className="tc-student-chip" data-tone="soft">
                  {countTopics(subject.topics)} topics
                </span>
              </div>
              <SubjectTopicCapsules subject={subject} />
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          eyebrow="Catalog"
          title="No subjects match this selection."
          description="Try another track or search."
        />
      )}
    </div>
  );
}
