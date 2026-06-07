"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  filterContentByContext,
  formatContentDate,
  getContentAccessDescriptor,
  getContentExcerpt,
  getContentFamilyDefinition,
  getStudentContent,
  matchesContentAccessFilter,
  type ContentSummary,
} from "@/lib/content";
import {
  buildStudentCatalogSnapshot,
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";
import { useStudentShellStore } from "@/stores";

const GUIDANCE_FAMILIES = ["CAREER_GUIDANCE", "INTERVIEW_GUIDANCE"] as const;
const ENTRIES_PER_PAGE = 10;

function buildPageWindow(currentPage: number, pageCount: number) {
  const pages = new Set<number>([1, pageCount, currentPage]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= pageCount) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

function getGuidanceHref(content: ContentSummary) {
  if (content.family === "CAREER_GUIDANCE") {
    return "/student/guidance/career";
  }

  return getContentFamilyDefinition(content.family).detailHref(content.slug);
}

export function StudentGuidanceEntriesScreen() {
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const contentQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getStudentContent(accessToken),
    queryKey: queryKeys.student.contentList({}),
    staleTime: 30_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;

  useEffect(() => {
    if (snapshot?.selectedTrack?.code && !activeExamTrackCode) {
      setActiveExamTrackCode(snapshot.selectedTrack.code);
    }
  }, [activeExamTrackCode, setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (
      snapshot?.selectedMedium?.code &&
      (!activeMediumCode || activeMediumCode !== snapshot.selectedMedium.code)
    ) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  const guidanceItems = useMemo(() => {
    if (!contentQuery.data || !snapshot) {
      return [];
    }

    return filterContentByContext(contentQuery.data.items, {
      examTrackId: snapshot.selectedTrack?.id ?? null,
      mediumId: snapshot.selectedMedium?.id ?? null,
    }).filter(
      (item) =>
        GUIDANCE_FAMILIES.includes(
          item.family as (typeof GUIDANCE_FAMILIES)[number],
        ) && matchesContentAccessFilter("all", item),
    );
  }, [contentQuery.data, snapshot]);

  const totalEntries = guidanceItems.length;
  const pageCount = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * ENTRIES_PER_PAGE;
  const visibleEntries = guidanceItems.slice(pageStart, pageStart + ENTRIES_PER_PAGE);
  const pageWindow = useMemo(
    () => buildPageWindow(currentPage, pageCount),
    [currentPage, pageCount],
  );
  const fromEntry = totalEntries === 0 ? 0 : pageStart + 1;
  const toEntry = Math.min(pageStart + visibleEntries.length, totalEntries);

  if (catalogQuery.isError || contentQuery.isError) {
    return (
      <ErrorState
        title="Guidance entries could not load."
        description="Please try again."
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
        title="Preparing guidance"
        description="Loading entries for the selected track and medium."
      />
    );
  }

  function updatePage(nextPage: number) {
    const clampedPage = Math.min(Math.max(nextPage, 1), pageCount);
    setPage(clampedPage);
    window.requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  if (guidanceItems.length === 0) {
    return (
      <EmptyState
        eyebrow="Guidance"
        title="No guidance entries are available yet."
        description={`Selected context: ${getTrackLabel(snapshot.selectedTrack)} - ${getMediumLabel(snapshot.selectedMedium)}`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section
        ref={listTopRef}
        className="tc-student-panel scroll-mt-4 rounded-[20px] p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tc-overline">Guidance</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--brand)]">
              {getTrackLabel(snapshot.selectedTrack)} - {getMediumLabel(snapshot.selectedMedium)}
            </p>
          </div>
          <span className="tc-student-chip" data-tone="soft">
            {totalEntries} entr{totalEntries === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/70 px-3 py-2">
          <p className="tc-muted text-sm font-semibold">
            Showing {fromEntry}-{toEntry} of {totalEntries}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="tc-pagination-button"
              disabled={currentPage === 1}
              aria-label="Previous page"
              onClick={() => updatePage(currentPage - 1)}
            >
              <span aria-hidden="true">&lt;</span>
              <span className="hidden sm:inline">Prev</span>
            </button>
            <span className="tc-pagination-status sm:hidden">
              {currentPage} / {pageCount}
            </span>
            <div className="hidden items-center gap-1 sm:flex">
              {pageWindow.map((pageNumber, index) => {
                const previousPage = pageWindow[index - 1];
                const showGap = previousPage && pageNumber - previousPage > 1;

                return (
                  <div key={pageNumber} className="flex items-center gap-1">
                    {showGap ? (
                      <span className="tc-pagination-gap" aria-hidden="true">
                        ...
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="tc-pagination-page"
                      data-active={pageNumber === currentPage}
                      aria-current={pageNumber === currentPage ? "page" : undefined}
                      onClick={() => updatePage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="tc-pagination-button"
              disabled={currentPage === pageCount}
              aria-label="Next page"
              onClick={() => updatePage(currentPage + 1)}
            >
              <span className="hidden sm:inline">Next</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {visibleEntries.map((entry) => {
          const definition = getContentFamilyDefinition(entry.family);
          const accessDescriptor = getContentAccessDescriptor(entry.access);

          return (
            <Link
              key={entry.id}
              href={getGuidanceHref(entry)}
              className="tc-student-card rounded-[18px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="tc-overline">{definition.shortLabel}</p>
                <span className="tc-student-chip">
                  {accessDescriptor.badgeLabel}
                </span>
              </div>

              <TextContent
                as="h2"
                className="mt-3 text-xl font-semibold text-[color:var(--brand)]"
                value={entry.title}
              />
              <TextContent
                as="p"
                className="tc-muted mt-2 line-clamp-2 text-sm leading-6"
                value={getContentExcerpt(entry)}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="tc-student-chip" data-tone="soft">
                  Published {formatContentDate(entry.publishedAt)}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {pageCount > 1 ? (
        <section className="tc-student-panel rounded-[20px] p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="tc-muted text-center text-sm font-semibold sm:text-left">
              Page {currentPage} of {pageCount}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                className="tc-pagination-button justify-center"
                disabled={currentPage === 1}
                onClick={() => updatePage(currentPage - 1)}
              >
                &lt; Previous
              </button>
              <button
                type="button"
                className="tc-pagination-button justify-center"
                disabled={currentPage === pageCount}
                onClick={() => updatePage(currentPage + 1)}
              >
                Next &gt;
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
