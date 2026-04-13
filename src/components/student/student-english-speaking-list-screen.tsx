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
        description="The student app could not fetch the published English speaking library."
        onRetry={() => void topicsQuery.refetch()}
      />
    );
  }

  if (topicsQuery.isLoading || !topicsQuery.data) {
    return (
      <LoadingState
        title="Preparing English speaking"
        description="Loading the published topic list and the latest access state."
      />
    );
  }

  if (topicsQuery.data.items.length === 0) {
    return (
      <EmptyState
        eyebrow="English speaking"
        title="The first speaking topics are still being prepared."
        description="Once the admin publishes a topic with finalized audio, it will appear here automatically."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              English speaking
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Listen topic by topic, then repeat the same sentence flow in Hindi, Marathi, and English.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Each topic is organized as short sentence drills so you can hear the natural order, switch the language mix, and move through the lesson without extra clutter.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                {topicsQuery.data.total} published topic{topicsQuery.data.total === 1 ? "" : "s"}
              </span>
              <span className="tc-stat-chip">Hindi → Marathi → English by default</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Playback flow</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Choose one sentence or play the whole topic.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                Language selection stays flexible, but the order stays calm and predictable.
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Student control</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Toggle the languages you want to hear.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                Keep all three on for practice, or narrow it down to just the pair you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {topicsQuery.data.items.map((topic) => (
          <Link
            key={topic.id}
            href={`/student/english-speaking/${encodeURIComponent(topic.slug)}`}
            className="tc-student-card rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="tc-overline">Topic</p>
              <span className="tc-code-chip">
                {topic.accessMode === "LOCKED" ? "Premium" : "Ready to listen"}
              </span>
            </div>

            <TextContent
              as="h2"
              className="tc-display mt-4 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
              value={topic.title}
            />
            <TextContent
              as="p"
              className="tc-muted mt-3 text-sm leading-6"
              value={
                topic.description ??
                "Open the topic to see the sentence deck and start the audio playlist."
              }
            />

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="tc-stat-chip">{topic.sentenceCount} sentences</span>
              <span className="tc-stat-chip">
                Published {formatTopicDate(topic.publishedAt)}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
