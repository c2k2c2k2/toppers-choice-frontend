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
  buildSubjectCatalogHref,
  countTopics,
  flattenTopicTree,
  getStudentCatalog,
  getTrackLabel,
  getOptionalText,
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
    subject.code,
    subject.slug,
    getOptionalText(subject.description) ?? "",
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

export function StudentCatalogScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    activeExamTrackCode,
    activeMediumCode,
    lastCatalogSubjectSlug,
    setActiveExamTrackCode,
    setActiveMediumCode,
    setLastCatalogSubjectSlug,
  } = useStudentShellStore();
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const requestedTrack = searchParams.get("track");
  const requestedMedium = searchParams.get("medium");

  const catalogQuery = useAuthenticatedQuery({
    queryKey: queryKeys.student.catalog(),
    queryFn: getStudentCatalog,
    staleTime: 60_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: requestedTrack ?? activeExamTrackCode,
        mediumCode: requestedMedium ?? activeMediumCode,
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
        description="We couldn't finish loading the authenticated taxonomy catalog for the student surface."
        onRetry={() => void catalogQuery.refetch()}
      />
    );
  }

  if (catalogQuery.isLoading || !catalog || !snapshot) {
    return (
      <LoadingState
        title="Preparing the catalog"
        description="Loading exam tracks, mediums, subjects, and topic trees for the student app."
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
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Student catalog
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Browse the published subject map before notes and tests plug in.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              This route keeps track, medium, and subject navigation centralized
              so later student modules can reuse the same study context.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Visible subjects</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {filteredSubjects.length}
              </p>
              <p className="mt-2 text-sm text-white/72">
                filtered for the active track and search terms
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Last opened subject</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {lastCatalogSubjectSlug ?? "No subject opened yet"}
              </p>
              <p className="mt-2 text-sm text-white/72">
                stored in the cross-route student shell state
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="tc-panel rounded-[28px] p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1.1fr]">
          <div className="space-y-3">
            <p className="tc-overline">Exam track</p>
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
                      updateFilters({ track: examTrack.code });
                    }}
                  >
                    {getTrackLabel(examTrack)}
                  </button>
                ))
              ) : (
                <span className="tc-code-chip">No tracks yet</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="tc-overline">Study medium</p>
            <div className="flex flex-wrap gap-2">
              {catalog.mediums.length > 0 ? (
                catalog.mediums.map((medium) => (
                  <button
                    key={medium.id}
                    type="button"
                    className="tc-filter-chip"
                    data-active={snapshot.selectedMedium?.id === medium.id}
                    onClick={() => {
                      setActiveMediumCode(medium.code);
                      updateFilters({ medium: medium.code });
                    }}
                  >
                    {medium.name}
                  </button>
                ))
              ) : (
                <span className="tc-code-chip">No mediums yet</span>
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
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredSubjects.map((subject) => (
            <Link
              key={subject.id}
              href={buildSubjectCatalogHref(subject, {
                examTrackCode: snapshot.selectedTrack?.code ?? null,
                mediumCode: snapshot.selectedMedium?.code ?? null,
              })}
              onClick={() => setLastCatalogSubjectSlug(subject.slug)}
              className="tc-card rounded-[26px] p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[color:var(--brand)]">
                  {subject.name}
                </h2>
                <span className="tc-code-chip">{subject.code}</span>
              </div>
              <p className="tc-muted mt-3 text-sm leading-6">
                {getOptionalText(subject.description) ??
                  "Topic navigation is ready for notes, practice, tests, and structured content."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                <span>{countTopics(subject.topics)} topics</span>
                <span>{subject.topics.length} top-level branches</span>
                <span>{snapshot.selectedMedium?.name ?? "All mediums"}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          eyebrow="Catalog empty state"
          title="No catalog subjects match this selection yet."
          description="This route is now wired to the authenticated taxonomy catalog, so newly published tracks, subjects, or topic trees will appear here without any hardcoded frontend fallback."
        />
      )}
    </div>
  );
}
