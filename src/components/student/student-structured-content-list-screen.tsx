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
  filterContentByContext,
  formatContentDate,
  formatReadingTime,
  getContentAccessDescriptor,
  getContentExcerpt,
  getContentFamilyDefinition,
  getContentMediumLabels,
  getContentTrackLabels,
  getStudentContent,
  matchesContentAccessFilter,
  type ContentAccessFilter,
  type ContentFamily,
  type ContentSummary,
} from "@/lib/content";
import {
  buildStudentCatalogSnapshot,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { useStudentShellStore } from "@/stores";

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

function ContentSummaryCard({
  content,
  family,
}: Readonly<{
  content: ContentSummary;
  family: ContentFamily;
}>) {
  const definition = getContentFamilyDefinition(family);
  const accessDescriptor = getContentAccessDescriptor(content.access);
  const trackLabels = getContentTrackLabels(content).slice(0, 2);
  const mediumLabels = getContentMediumLabels(content).slice(0, 2);

  return (
    <Link
      href={definition.detailHref(content.slug)}
      className="tc-card rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="tc-overline">{definition.label}</p>
        <span className="tc-code-chip">{accessDescriptor.badgeLabel}</span>
      </div>

      <h2 className="tc-display mt-4 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
        {content.title}
      </h2>
      <p className="tc-muted mt-3 text-sm leading-6">{getContentExcerpt(content)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="tc-stat-chip">{formatReadingTime(content.readingTimeMinutes)}</span>
        <span className="tc-stat-chip">
          Published {formatContentDate(content.publishedAt)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {trackLabels.length > 0 ? (
          trackLabels.map((label) => (
            <span key={`${content.id}-${label}`} className="tc-code-chip">
              {label}
            </span>
          ))
        ) : (
          <span className="tc-code-chip">All tracks</span>
        )}

        {mediumLabels.length > 0 ? (
          mediumLabels.map((label) => (
            <span key={`${content.id}-${label}`} className="tc-code-chip">
              {label}
            </span>
          ))
        ) : (
          <span className="tc-code-chip">All mediums</span>
        )}
      </div>
    </Link>
  );
}

export function StudentStructuredContentListScreen({
  family,
}: Readonly<{
  family: ContentFamily;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();
  const [accessFilter, setAccessFilter] = useState<ContentAccessFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const requestedTrack = searchParams.get("track");
  const requestedMedium = searchParams.get("medium");
  const definition = getContentFamilyDefinition(family);

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const contentQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      getStudentContent(accessToken, {
        family,
        search: deferredSearchValue || null,
      }),
    queryKey: queryKeys.student.contentList({
      family,
      search: deferredSearchValue || null,
    }),
    staleTime: 30_000,
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

  if (catalogQuery.isError || contentQuery.isError) {
    return (
      <ErrorState
        title={`${definition.label} could not load.`}
        description="We couldn't finish loading the selected structured content family for the active student context."
        onRetry={() => {
          void catalogQuery.refetch();
          void contentQuery.refetch();
        }}
      />
    );
  }

  if (
    catalogQuery.isLoading ||
    contentQuery.isLoading ||
    !catalog ||
    !snapshot ||
    !contentQuery.data
  ) {
    return (
      <LoadingState
        title={`Preparing ${definition.label.toLowerCase()}`}
        description="Loading the student catalog context and matching structured content entries."
      />
    );
  }

  const filteredItems = filterContentByContext(contentQuery.data.items, {
    examTrackId: snapshot.selectedTrack?.id ?? null,
    mediumId: snapshot.selectedMedium?.id ?? null,
  }).filter((item) => matchesContentAccessFilter(accessFilter, item));
  const featuredItems = filteredItems.filter((item) => item.isFeatured).slice(0, 2);

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
              {definition.eyebrow}
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {definition.heroTitle}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {definition.heroDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {snapshot.selectedMedium?.name ?? "All mediums"}
              </span>
              <span className="tc-stat-chip">{filteredItems.length} results</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Featured items</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {featuredItems.length}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Highlighted for the current track and medium context
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Access filter</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {accessFilter === "all"
                  ? "All lessons"
                  : accessFilter === "available"
                    ? "Available now"
                    : "Locked premium"}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Keep discovery and entitlement cues in the same list experience
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
              {catalog.examTracks.map((examTrack) => (
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
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="tc-overline">Study medium</p>
            <div className="flex flex-wrap gap-2">
              {catalog.mediums.map((medium) => (
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
              ))}
            </div>
          </div>

          <label className="tc-form-field">
            <span className="tc-form-label">Search lessons</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="tc-input"
              placeholder="Search interviews, monthly updates, speaking drills..."
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["all", "available", "locked"] as const).map((filterValue) => (
            <button
              key={filterValue}
              type="button"
              className="tc-filter-chip"
              data-active={accessFilter === filterValue}
              onClick={() => setAccessFilter(filterValue)}
            >
              {filterValue === "all"
                ? "All lessons"
                : filterValue === "available"
                  ? "Available now"
                  : "Locked premium"}
            </button>
          ))}
        </div>
      </section>

      {filteredItems.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => (
            <ContentSummaryCard key={item.id} content={item} family={family} />
          ))}
        </section>
      ) : (
        <EmptyState
          eyebrow={definition.eyebrow}
          title={definition.emptyTitle}
          description={definition.emptyDescription}
          ctaHref={definition.hubHref}
          ctaLabel="Back to learning hub"
        />
      )}
    </div>
  );
}
