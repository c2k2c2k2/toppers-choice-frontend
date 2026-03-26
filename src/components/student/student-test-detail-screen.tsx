"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  getPublishedTest,
  getTestAttemptStatusLabel,
  getTestFamilyLabel,
  listTestAttempts,
  startTestAttempt,
} from "@/lib/tests";
import { StructuredContentRenderer } from "@/components/content/structured-content-renderer";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { PremiumAccessCard } from "@/components/payments/premium-access-card";
import { buildStudentPlansHref } from "@/lib/payments";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudentTestDetailScreen({
  testId,
}: Readonly<{
  testId: string;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  const testQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getPublishedTest(testId, accessToken),
    queryKey: queryKeys.student.testDetail(testId),
    staleTime: 30_000,
  });

  const attemptsQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      listTestAttempts(accessToken, {
        limit: 5,
        testId,
      }),
    queryKey: queryKeys.student.testAttempts({
      limit: 5,
      status: null,
      testId,
    }),
    staleTime: 15_000,
  });

  const startMutation = useAuthenticatedMutation({
    mutationFn: (_: void, accessToken) => startTestAttempt(testId, accessToken),
    onSuccess: async (attempt) => {
      setInlineMessage(null);
      await queryClient.invalidateQueries({
        queryKey: ["student", "tests"],
      });
      router.push(`/student/tests/attempts/${attempt.id}`);
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "TEST_ACTIVE_ATTEMPT_EXISTS") {
        setInlineMessage(
          "An active attempt already exists for this test. Resume it instead of starting another one.",
        );
      }
    },
  });

  if (testQuery.isLoading || attemptsQuery.isLoading || !testQuery.data) {
    if (
      testQuery.isError &&
      isApiError(testQuery.error) &&
      testQuery.error.status === 404
    ) {
      return (
        <EmptyState
          eyebrow="Timed test"
          title="That test is not available."
          description="The test detail route is live, but the requested test id is not currently published for the student surface."
          ctaHref="/student/tests"
          ctaLabel="Back to tests"
        />
      );
    }

    if (testQuery.isError || attemptsQuery.isError) {
      return (
        <ErrorState
          title="Test instructions could not load."
          description="We couldn't finish loading the selected test and its attempt history."
          onRetry={() => {
            void testQuery.refetch();
            void attemptsQuery.refetch();
          }}
        />
      );
    }

    return (
      <LoadingState
        title="Preparing test instructions"
        description="Loading the selected test rules, instructions, and any resumable attempts."
      />
    );
  }

  const test = testQuery.data;
  const attemptsData = attemptsQuery.data ?? {
    items: [],
    total: 0,
  };
  const activeAttempt =
    attemptsData.items.find((attempt) => attempt.status === "ACTIVE") ?? null;
  const attemptHistory = attemptsData.items.filter(
    (attempt) => attempt.status !== "ACTIVE",
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Timed test detail
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {test.title}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {test.shortDescription ??
                "Review the instructions and attempt rules before the timer starts."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">{getTestFamilyLabel(test.family)}</span>
              <span className="tc-stat-chip">{test.durationMinutes} minutes</span>
              <span className="tc-stat-chip">{test.questionCount} questions</span>
              <span className="tc-stat-chip">{test.access.mode}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {activeAttempt ? (
                <Link
                  href={`/student/tests/attempts/${activeAttempt.id}`}
                  className="tc-button-primary"
                >
                  Resume active attempt
                </Link>
              ) : test.access.canAttempt ? (
                <button
                  type="button"
                  className="tc-button-primary"
                  onClick={() => void startMutation.mutateAsync()}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? "Starting attempt..." : "Start test"}
                </button>
              ) : (
                <Link
                  href={buildStudentPlansHref({
                    intent: "tests",
                    planId: null,
                    returnTo: `/student/tests/${test.id}`,
                    source: "test-detail",
                  })}
                  className="tc-button-primary"
                >
                  View plans
                </Link>
              )}
              <Link href="/student/tests" className="tc-button-secondary">
                Back to tests
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Max attempts</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {test.maxAttempts}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Available until {formatTimestamp(test.availableUntil)}
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Max score</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {test.maxScore}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Access: {test.access.reason ?? "Ready to attempt"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {inlineMessage ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          {inlineMessage}
          {activeAttempt ? (
            <div className="mt-4">
              <Link
                href={`/student/tests/attempts/${activeAttempt.id}`}
                className="tc-button-primary"
              >
                Resume active attempt
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {test.access.mode === "LOCKED" ? (
        <PremiumAccessCard
          badgeLabel="Access"
          description={
            test.access.reason ??
            "A premium entitlement is required before the attempt can begin."
          }
          hints={[
            "Timed attempts only start after the student entitlement state is rechecked from the backend.",
            "The shared payment result route can refresh this test surface after success.",
          ]}
          intent="tests"
          primaryLabel="Unlock test access"
          returnTo={`/student/tests/${test.id}`}
          secondaryHref="/student/tests"
          secondaryLabel="Back to tests"
          source="test-detail-locked"
          title="This test is currently locked."
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="tc-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Instructions
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Read before you start
              </h2>
            </div>
          </div>

          <div className="mt-5 text-[color:var(--brand)]">
            {test.instructionsJson ? (
              <StructuredContentRenderer
                bodyJson={test.instructionsJson}
                showLocaleBadge={false}
              />
            ) : (
              <div className="tc-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  No authored instruction body is published yet.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  The attempt route is still ready, but this test currently
                  falls back to its meta rules instead of long-form instructions.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Attempt rules
            </p>
            <div className="mt-5 grid gap-4">
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Availability</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatTimestamp(test.availableFrom)} to {formatTimestamp(test.availableUntil)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Attempt policy</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {test.maxAttempts} attempts, {test.durationMinutes} minutes
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Question order</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {test.randomizeQuestionOrder ? "Randomized" : "Fixed order"}
                </p>
              </div>
            </div>
          </section>

          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Attempt history
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Resume or review
                </h2>
              </div>
              <span className="tc-code-chip">{attemptsData.total} total</span>
            </div>

            <div className="mt-5 grid gap-4">
              {activeAttempt ? (
                <article className="tc-card rounded-[24px] p-5">
                  <p className="tc-overline">Active attempt</p>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                    Attempt {activeAttempt.attemptNumber}
                  </h3>
                  <p className="tc-muted mt-3 text-sm leading-6">
                    Expires {formatTimestamp(activeAttempt.expiresAt)}.
                  </p>
                  <Link
                    href={`/student/tests/attempts/${activeAttempt.id}`}
                    className="tc-button-primary mt-4"
                  >
                    Resume attempt
                  </Link>
                </article>
              ) : null}

              {attemptHistory.length > 0 ? (
                attemptHistory.map((attempt) => (
                  <article key={attempt.id} className="tc-card rounded-[24px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="tc-overline">
                          {getTestAttemptStatusLabel(attempt.status)}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                          Attempt {attempt.attemptNumber}
                        </h3>
                      </div>
                      <span className="tc-code-chip">{attempt.percentage}%</span>
                    </div>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      Submitted {formatTimestamp(attempt.submittedAt)} with score{" "}
                      {attempt.score}/{attempt.maxScore}.
                    </p>
                    <Link
                      href={`/student/tests/attempts/${attempt.id}`}
                      className="tc-button-secondary mt-4"
                    >
                      Open result
                    </Link>
                  </article>
                ))
              ) : (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    No completed attempts yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}
