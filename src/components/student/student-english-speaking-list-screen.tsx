"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import { listStudentEnglishSpeakingTopics } from "@/lib/english-speaking";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";

const TOPICS_PER_PAGE = 10;

function formatTopicDate(value: string | null) {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function buildPageWindow(currentPage: number, pageCount: number) {
  const pages = new Set<number>([1, pageCount, currentPage]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= pageCount) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

export function StudentEnglishSpeakingListScreen() {
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const topicsQuery = useAuthenticatedQuery({
    queryFn: listStudentEnglishSpeakingTopics,
    queryKey: queryKeys.student.englishSpeakingList(),
    staleTime: 30_000,
  });
  const topics = topicsQuery.data?.items ?? [];
  const totalTopics = topics.length;
  const pageCount = Math.max(1, Math.ceil(totalTopics / TOPICS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * TOPICS_PER_PAGE;
  const visibleTopics = topics.slice(pageStart, pageStart + TOPICS_PER_PAGE);
  const pageWindow = useMemo(
    () => buildPageWindow(currentPage, pageCount),
    [currentPage, pageCount],
  );
  const fromTopic = pageStart + 1;
  const toTopic = Math.min(pageStart + visibleTopics.length, totalTopics);

  if (topicsQuery.isError) {
    return (
      <ErrorState
        title="English speaking topics could not load."
        description="Please try again."
        onRetry={() => void topicsQuery.refetch()}
      />
    );
  }

  if (topicsQuery.isLoading || !topicsQuery.data) {
    return (
      <LoadingState
        title="Preparing English speaking"
        description="Loading topics."
      />
    );
  }

  if (topics.length === 0) {
    return (
      <EmptyState
        eyebrow="English speaking"
        title="No speaking topics are available yet."
        description="Please check again later."
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

  return (
    <div className="flex flex-col gap-4">
      <section ref={listTopRef} className="tc-student-panel scroll-mt-4 rounded-[20px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tc-overline">English speaking</p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--brand)]">
              Topics
            </h1>
          </div>
          <span className="tc-student-chip" data-tone="soft">
            {topicsQuery.data.total} topic{topicsQuery.data.total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/70 px-3 py-2">
          <p className="tc-muted text-sm font-semibold">
            Showing {fromTopic}-{toTopic} of {totalTopics}
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

      <section className="grid gap-3 xl:grid-cols-2">
        {visibleTopics.map((topic) => (
          <Link
            key={topic.id}
            href={`/student/english-speaking/${encodeURIComponent(topic.slug)}`}
            className="tc-student-card rounded-[18px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="tc-overline">Topic</p>
              <span className="tc-student-chip">
                {topic.accessMode === "LOCKED" ? "Premium" : "Ready to listen"}
              </span>
            </div>

            <TextContent
              as="h2"
              className="mt-3 text-xl font-semibold text-[color:var(--brand)]"
              value={topic.title}
            />
            {topic.description ? (
              <TextContent
                as="p"
                className="tc-muted mt-2 line-clamp-2 text-sm leading-6"
                value={topic.description}
              />
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tc-student-chip">{topic.sentenceCount} sentences</span>
              <span className="tc-student-chip" data-tone="soft">
                Published {formatTopicDate(topic.publishedAt)}
              </span>
            </div>
          </Link>
        ))}
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
