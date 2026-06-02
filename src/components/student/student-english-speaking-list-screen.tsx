"use client";

import Link from "next/link";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import { listStudentEnglishSpeakingTopics } from "@/lib/english-speaking";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";

function formatTopicDate(value: string | null) {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function StudentEnglishSpeakingListScreen() {
  const topicsQuery = useAuthenticatedQuery({
    queryFn: listStudentEnglishSpeakingTopics,
    queryKey: queryKeys.student.englishSpeakingList(),
    staleTime: 30_000,
  });

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

  if (topicsQuery.data.items.length === 0) {
    return (
      <EmptyState
        eyebrow="English speaking"
        title="No speaking topics are available yet."
        description="Please check again later."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[20px] p-4">
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
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        {topicsQuery.data.items.map((topic) => (
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
    </div>
  );
}
