"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  areAssessmentDraftsEqual,
  formatAssessmentDate,
  formatAssessmentDuration,
  getAssessmentAnswerDraftLabel,
  hasAssessmentDraft,
  normalizeAssessmentDraft,
  readAssessmentQuestion,
} from "@/lib/assessment";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError, type ApiError } from "@/lib/api/errors";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  getTestAttemptStatusLabel,
  getTestFamilyLabel,
  getTestAttempt,
  saveTestAttemptAnswer,
  submitTestAttempt,
} from "@/lib/tests";
import { AssessmentQuestionCard } from "@/components/assessment/assessment-question-card";
import { AssessmentResultBreakdown } from "@/components/assessment/assessment-result-breakdown";
import { AssessmentReviewPanel } from "@/components/assessment/assessment-review-panel";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { useTestAttemptStore } from "@/stores";

function resolveDraftStatus(input: {
  currentDraft: ReturnType<typeof normalizeAssessmentDraft>;
  syncedDraft: ReturnType<typeof normalizeAssessmentDraft>;
}) {
  if (!hasAssessmentDraft(input.currentDraft)) {
    return {
      label: "No draft yet",
      tone: "idle" as const,
    };
  }

  if (areAssessmentDraftsEqual(input.currentDraft, input.syncedDraft)) {
    return {
      label: "Draft saved",
      tone: "success" as const,
    };
  }

  return {
    label: "Unsaved changes",
    tone: "warning" as const,
  };
}

function getPaletteClasses(tone: "danger" | "idle" | "success" | "warning") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[rgba(0,30,64,0.08)] bg-white/76 text-[color:var(--brand)]";
}

function AttemptMetricCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="tc-glass rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function StudentTestAttemptScreen({
  attemptId,
}: Readonly<{
  attemptId: string;
}>) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const autoSubmitTriggeredRef = useRef(false);

  const attemptQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getTestAttempt(attemptId, accessToken),
    queryKey: queryKeys.student.testAttempt(attemptId),
    staleTime: 5_000,
  });
  const attemptEntry = useTestAttemptStore((state) => state.attempts[attemptId]);
  const clearTestAttempt = useTestAttemptStore((state) => state.clearTestAttempt);
  const hydrateTestAttempt = useTestAttemptStore((state) => state.hydrateTestAttempt);
  const markTestAnswerSynced = useTestAttemptStore(
    (state) => state.markTestAnswerSynced,
  );
  const setTestAttemptCurrentQuestion = useTestAttemptStore(
    (state) => state.setTestAttemptCurrentQuestion,
  );
  const setTestAttemptDraft = useTestAttemptStore(
    (state) => state.setTestAttemptDraft,
  );

  useEffect(() => {
    if (!attemptQuery.data) {
      return;
    }

    hydrateTestAttempt(
      attemptId,
      attemptQuery.data.expiresAt,
      attemptQuery.data.questions,
    );
  }, [attemptId, attemptQuery.data, hydrateTestAttempt]);

  useEffect(() => {
    if (attemptQuery.data?.status !== "ACTIVE") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [attemptQuery.data?.status]);

  const saveMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        answerJson: ReturnType<typeof normalizeAssessmentDraft>;
        questionId: string;
      },
      accessToken,
    ) => saveTestAttemptAnswer(attemptId, input, accessToken),
    onSuccess: async (result) => {
      markTestAnswerSynced(attemptId, result.questionId, result.answerJson);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.testAttempts({
          limit: 8,
          status: null,
          testId: null,
        }),
      });
    },
  });

  const submitMutation = useAuthenticatedMutation({
    mutationFn: (_: void, accessToken) => submitTestAttempt(attemptId, accessToken),
    onSuccess: async (result) => {
      await queryClient.setQueryData(
        queryKeys.student.testAttempt(attemptId),
        result,
      );
      await queryClient.invalidateQueries({
        queryKey: ["student", "tests"],
      });
    },
  });

  useEffect(() => {
    autoSubmitTriggeredRef.current = false;
  }, [attemptId]);

  const attempt = attemptQuery.data;

  const parsedQuestions =
    attempt?.questions.flatMap((question) => {
      const resolvedQuestion = readAssessmentQuestion(question.questionSnapshot);

      if (!resolvedQuestion) {
        return [];
      }

      return [
        {
          ...question,
          resolvedQuestion,
        },
      ];
    }) ?? [];
  const unresolvedQuestionCount =
    (attempt?.questions.length ?? 0) - parsedQuestions.length;

  const currentQuestionId =
    attemptEntry?.currentQuestionId ?? parsedQuestions[0]?.questionId ?? null;
  const currentQuestionIndex = parsedQuestions.findIndex(
    (question) => question.questionId === currentQuestionId,
  );
  const currentQuestion =
    parsedQuestions[currentQuestionIndex >= 0 ? currentQuestionIndex : 0] ?? null;
  const currentDraft = currentQuestion
    ? attemptEntry?.drafts[currentQuestion.questionId] ??
      normalizeAssessmentDraft(
        currentQuestion.finalAnswerJson ?? currentQuestion.latestSavedAnswerJson,
      )
    : {};
  const currentSyncedDraft = currentQuestion
    ? attemptEntry?.syncedDrafts[currentQuestion.questionId] ??
      normalizeAssessmentDraft(
        currentQuestion.finalAnswerJson ?? currentQuestion.latestSavedAnswerJson,
      )
    : {};
  const draftStatus = resolveDraftStatus({
    currentDraft: normalizeAssessmentDraft(currentDraft),
    syncedDraft: normalizeAssessmentDraft(currentSyncedDraft),
  });
  const timeRemainingSeconds = attempt
    ? Math.max(
        0,
        Math.round((new Date(attempt.expiresAt).getTime() - now) / 1000),
      )
    : 0;

  useEffect(() => {
    if (!attempt || attempt.status !== "ACTIVE" || timeRemainingSeconds > 0) {
      return;
    }

    if (autoSubmitTriggeredRef.current) {
      return;
    }

    autoSubmitTriggeredRef.current = true;
    void submitMutation.mutateAsync();
  }, [attempt, submitMutation, timeRemainingSeconds]);

  const currentDraftKey =
    currentQuestion && hasAssessmentDraft(currentDraft)
      ? JSON.stringify(normalizeAssessmentDraft(currentDraft))
      : "";
  const syncedDraftKey =
    currentQuestion && hasAssessmentDraft(currentSyncedDraft)
      ? JSON.stringify(normalizeAssessmentDraft(currentSyncedDraft))
      : "";

  useEffect(() => {
    const draftToSave = currentDraftKey
      ? (JSON.parse(currentDraftKey) as ReturnType<typeof normalizeAssessmentDraft>)
      : {};
    const syncedDraftToCompare = syncedDraftKey
      ? (JSON.parse(syncedDraftKey) as ReturnType<typeof normalizeAssessmentDraft>)
      : {};

    if (
      !attempt ||
      attempt.status !== "ACTIVE" ||
      !currentQuestion ||
      !hasAssessmentDraft(draftToSave) ||
      areAssessmentDraftsEqual(draftToSave, syncedDraftToCompare)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveMutation.mutateAsync({
        answerJson: draftToSave,
        questionId: currentQuestion.questionId,
      });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    attempt,
    currentDraftKey,
    currentQuestion,
    saveMutation,
    syncedDraftKey,
  ]);

  if (attemptQuery.isLoading || !attempt) {
    if (
      attemptQuery.isError &&
      isApiError(attemptQuery.error) &&
      attemptQuery.error.status === 404
    ) {
      return (
        <EmptyState
          eyebrow="Test attempt"
          title="That test attempt was not found."
          description="The timed test routes are live, but the requested attempt id does not belong to the current student account."
          ctaHref="/student/tests"
          ctaLabel="Back to tests"
        />
      );
    }

    if (attemptQuery.isError) {
      return (
        <ErrorState
          title="Test attempt could not load."
          description="We couldn't finish restoring the selected test attempt from the backend."
          onRetry={() => void attemptQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title="Restoring test attempt"
        description="Loading the timer, saved drafts, question palette, and result review state."
      />
    );
  }

  if (unresolvedQuestionCount > 0 || !currentQuestion?.resolvedQuestion) {
    return (
      <ErrorState
        title="Question snapshots could not be rendered."
        description="One or more test questions arrived without the expected student question shape, so the attempt cannot be rendered safely."
      />
    );
  }

  const mutationError =
    (saveMutation.isError && (saveMutation.error as ApiError)) ||
    (submitMutation.isError && (submitMutation.error as ApiError)) ||
    null;

  if (attempt.status !== "ACTIVE") {
    return (
      <div className="flex flex-col gap-6">
        <section className="tc-hero rounded-[32px] p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
                Test result
              </p>
              <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {attempt.testSnapshot.title}
              </h1>
              <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
                The attempt is now locked. Review the per-question feedback,
                score breakdown, and submission timing before starting another
                timed attempt.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/student/tests" className="tc-button-primary">
                  Back to tests
                </Link>
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={() => clearTestAttempt(attemptId)}
                >
                  Clear local draft copy
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AttemptMetricCard label="Score" value={`${attempt.score}`} />
              <AttemptMetricCard
                label="Percentage"
                value={`${attempt.percentage}%`}
              />
              <AttemptMetricCard
                label="Correct"
                value={String(attempt.correctCount)}
              />
              <AttemptMetricCard
                label="Time taken"
                value={formatAssessmentDuration(attempt.timeTakenSeconds ?? 0)}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="tc-panel rounded-[28px] p-6">
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Attempt summary
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Status</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {getTestAttemptStatusLabel(attempt.status)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Submitted</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatAssessmentDate(attempt.submittedAt)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Skipped</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {attempt.skippedCount}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Family</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {getTestFamilyLabel(attempt.testSnapshot.family)}
                </p>
              </div>
            </div>
          </section>

          <AssessmentResultBreakdown breakdown={attempt.resultBreakdownJson} />
        </section>

        <div className="grid gap-6">
          {parsedQuestions.map((question, index) => {
            const answerDraft =
              attemptEntry?.drafts[question.questionId] ??
              normalizeAssessmentDraft(
                question.finalAnswerJson ?? question.latestSavedAnswerJson,
              );

            return (
              <div key={question.id} className="grid gap-4">
                <AssessmentQuestionCard
                  answerDraft={answerDraft}
                  question={question.resolvedQuestion}
                  questionNumber={index + 1}
                  readOnly
                  status={{
                    label:
                      question.isCorrect === true
                        ? "Answered correctly"
                        : question.isCorrect === false
                          ? "Needs revision"
                          : "Skipped",
                    tone:
                      question.isCorrect === true
                        ? "success"
                        : question.isCorrect === false
                          ? "danger"
                          : "idle",
                  }}
                />
                <AssessmentReviewPanel
                  correctAnswerJson={question.correctAnswerJson}
                  explanationJson={question.explanationJson}
                  question={question.resolvedQuestion}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Active timed attempt
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {attempt.testSnapshot.title}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Drafts autosave while you move through the question palette, but
              correctness stays hidden until the test is submitted or the timer
              expires.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                {formatAssessmentDuration(timeRemainingSeconds)} left
              </span>
              <span className="tc-stat-chip">
                {attempt.answeredCount}/{attempt.questionCount} answered
              </span>
              <span className="tc-stat-chip">
                {getTestFamilyLabel(attempt.testSnapshot.family)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AttemptMetricCard
              label="Timer"
              value={formatAssessmentDuration(timeRemainingSeconds)}
            />
            <AttemptMetricCard
              label="Saved at"
              value={attempt.lastSavedAt ? formatAssessmentDate(attempt.lastSavedAt) : "Not yet"}
            />
          </div>
        </div>
      </section>

      {mutationError ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          {mutationError.message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="grid gap-6">
          <AssessmentQuestionCard
            answerDraft={currentDraft}
            question={currentQuestion.resolvedQuestion}
            questionNumber={
              currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : 1
            }
            onAnswerChange={(draft) =>
              setTestAttemptDraft(attemptId, currentQuestion.questionId, draft)
            }
            status={draftStatus}
            footer={
              <div className="grid gap-4">
                <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/76 px-4 py-4 text-sm text-[color:var(--muted)]">
                  Saved answer preview: {getAssessmentAnswerDraftLabel(currentDraft)}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      void saveMutation.mutateAsync({
                        answerJson: normalizeAssessmentDraft(currentDraft),
                        questionId: currentQuestion.questionId,
                      });
                    }}
                    disabled={
                      saveMutation.isPending ||
                      !hasAssessmentDraft(currentDraft) ||
                      areAssessmentDraftsEqual(currentDraft, currentSyncedDraft)
                    }
                  >
                    {saveMutation.isPending ? "Saving..." : "Save now"}
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (currentQuestionIndex <= 0) {
                        return;
                      }

                      setTestAttemptCurrentQuestion(
                        attemptId,
                        parsedQuestions[currentQuestionIndex - 1]?.questionId ?? null,
                      );
                    }}
                    disabled={currentQuestionIndex <= 0}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (currentQuestionIndex >= parsedQuestions.length - 1) {
                        return;
                      }

                      setTestAttemptCurrentQuestion(
                        attemptId,
                        parsedQuestions[currentQuestionIndex + 1]?.questionId ?? null,
                      );
                    }}
                    disabled={currentQuestionIndex >= parsedQuestions.length - 1}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="tc-button-primary"
                    onClick={() => void submitMutation.mutateAsync()}
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit test"}
                  </button>
                </div>
              </div>
            }
          />
        </div>

        <div className="grid gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Question palette
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Navigate the attempt
                </h2>
              </div>
              <span className="tc-code-chip">{parsedQuestions.length} questions</span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {parsedQuestions.map((question, index) => {
                const draft =
                  attemptEntry?.drafts[question.questionId] ??
                  normalizeAssessmentDraft(
                    question.finalAnswerJson ?? question.latestSavedAnswerJson,
                  );
                const syncedDraft =
                  attemptEntry?.syncedDrafts[question.questionId] ??
                  normalizeAssessmentDraft(
                    question.finalAnswerJson ?? question.latestSavedAnswerJson,
                  );
                const tone = resolveDraftStatus({
                  currentDraft: normalizeAssessmentDraft(draft),
                  syncedDraft: normalizeAssessmentDraft(syncedDraft),
                });
                const isCurrent = question.questionId === currentQuestion.questionId;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() =>
                      setTestAttemptCurrentQuestion(attemptId, question.questionId)
                    }
                    className={`rounded-[18px] border px-3 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 ${getPaletteClasses(tone.tone)}`}
                    style={{
                      boxShadow: isCurrent
                        ? "0 0 0 3px rgba(255, 184, 111, 0.22)"
                        : undefined,
                    }}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Attempt controls
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Save and submit safely
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Started</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatAssessmentDate(attempt.startedAt)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Expires</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatAssessmentDate(attempt.expiresAt)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Rules</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  Results unlock only after submission
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => void submitMutation.mutateAsync()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit test"}
              </button>
              <Link href="/student/tests" className="tc-button-secondary">
                Back to tests
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
