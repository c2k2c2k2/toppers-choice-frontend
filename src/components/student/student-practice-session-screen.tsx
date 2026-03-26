"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  areAssessmentDraftsEqual,
  formatAssessmentDate,
  getAssessmentQuestionStatusTone,
  hasAssessmentDraft,
  normalizeAssessmentDraft,
} from "@/lib/assessment";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  endPracticeSession,
  getNextPracticeQuestions,
  getPracticeSession,
  getPracticeSessionSummaryLabel,
  getPracticeModeLabel,
  revealPracticeAnswer,
  savePracticeAnswer,
  submitPracticeAnswer,
} from "@/lib/practice";
import { AssessmentQuestionCard } from "@/components/assessment/assessment-question-card";
import { AssessmentReviewPanel } from "@/components/assessment/assessment-review-panel";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { usePracticeSessionStore } from "@/stores";

function getQuestionTone(question: {
  answeredAt: string | null;
  isCorrect: boolean | null;
  revealedAt: string | null;
}) {
  return getAssessmentQuestionStatusTone(question);
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

function PracticeSummaryMetric({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="tc-card rounded-[22px] p-4">
      <p className="tc-overline">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--brand)]">
        {value}
      </p>
    </div>
  );
}

export function StudentPracticeSessionScreen({
  sessionId,
}: Readonly<{
  sessionId: string;
}>) {
  const queryClient = useQueryClient();
  const initialBatchRequestedRef = useRef(false);
  const sessionQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getPracticeSession(sessionId, accessToken),
    queryKey: queryKeys.student.practiceSession(sessionId),
    staleTime: 5_000,
  });
  const sessionEntry = usePracticeSessionStore(
    (state) => state.sessions[sessionId],
  );
  const clearPracticeSession = usePracticeSessionStore(
    (state) => state.clearPracticeSession,
  );
  const hydratePracticeSession = usePracticeSessionStore(
    (state) => state.hydratePracticeSession,
  );
  const markPracticeAnswerSynced = usePracticeSessionStore(
    (state) => state.markPracticeAnswerSynced,
  );
  const markPracticeRevealResult = usePracticeSessionStore(
    (state) => state.markPracticeRevealResult,
  );
  const setPracticeCurrentQuestion = usePracticeSessionStore(
    (state) => state.setPracticeCurrentQuestion,
  );
  const setPracticeDraft = usePracticeSessionStore((state) => state.setPracticeDraft);

  useEffect(() => {
    if (!sessionQuery.data) {
      return;
    }

    hydratePracticeSession(sessionId, sessionQuery.data.questions);
  }, [hydratePracticeSession, sessionId, sessionQuery.data]);

  const session = sessionQuery.data;
  const questions =
    session?.questions.slice().sort((left, right) => left.orderIndex - right.orderIndex) ??
    [];
  const currentQuestionId = sessionEntry?.currentQuestionId ?? questions[0]?.questionId ?? null;
  const currentQuestionIndex = questions.findIndex(
    (question) => question.questionId === currentQuestionId,
  );
  const currentQuestion =
    questions[currentQuestionIndex >= 0 ? currentQuestionIndex : 0] ?? null;
  const currentDraft = currentQuestion
    ? sessionEntry?.drafts[currentQuestion.questionId] ??
      normalizeAssessmentDraft(
        currentQuestion.answerJson ?? currentQuestion.latestSavedAnswerJson,
      )
    : {};
  const currentSyncedDraft = currentQuestion
    ? sessionEntry?.syncedDrafts[currentQuestion.questionId] ??
      normalizeAssessmentDraft(
        currentQuestion.answerJson ?? currentQuestion.latestSavedAnswerJson,
      )
    : {};
  const currentReveal =
    currentQuestion && sessionEntry?.revealedResults[currentQuestion.questionId]
      ? sessionEntry.revealedResults[currentQuestion.questionId]
      : null;
  const canLoadMore =
    session?.status === "ACTIVE" &&
    session.servedCount < session.questionCountTarget;

  const saveMutation = useAuthenticatedMutation({
    mutationFn: (input: { answerJson: typeof currentDraft; questionId: string }, accessToken) =>
      savePracticeAnswer(sessionId, input, accessToken),
    onSuccess: async (result) => {
      markPracticeAnswerSynced(sessionId, result.questionId, result.answerJson);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.student.practiceSessions({
          limit: 8,
          status: null,
        }),
      });
    },
  });

  const answerMutation = useAuthenticatedMutation({
    mutationFn: (
      input: { answerJson: typeof currentDraft; questionId: string; responseTimeMs: number | null },
      accessToken,
    ) =>
      submitPracticeAnswer(
        sessionId,
        {
          answerJson: input.answerJson,
          questionId: input.questionId,
          responseTimeMs: input.responseTimeMs,
        },
        accessToken,
      ),
    onSuccess: async (result) => {
      markPracticeAnswerSynced(sessionId, result.questionId, result.answerJson);
      await queryClient.invalidateQueries({
        queryKey: ["student", "practice"],
      });
    },
  });

  const revealMutation = useAuthenticatedMutation({
    mutationFn: (input: { questionId: string }, accessToken) =>
      revealPracticeAnswer(sessionId, input, accessToken),
    onSuccess: async (result) => {
      markPracticeRevealResult(sessionId, result);
      await queryClient.invalidateQueries({
        queryKey: ["student", "practice"],
      });
    },
  });

  const nextMutation = useAuthenticatedMutation({
    mutationFn: (_: void, accessToken) =>
      getNextPracticeQuestions(sessionId, accessToken, {
        batchSize: 5,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["student", "practice"],
      });
      if (result.items[0]) {
        setPracticeCurrentQuestion(sessionId, result.items[0].questionId);
      }
    },
  });

  const endMutation = useAuthenticatedMutation({
    mutationFn: (input: { abandon?: boolean }, accessToken) =>
      endPracticeSession(sessionId, accessToken, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["student", "practice"],
      });
    },
  });

  useEffect(() => {
    if (!session || session.status !== "ACTIVE" || questions.length > 0) {
      initialBatchRequestedRef.current = false;
      return;
    }

    if (initialBatchRequestedRef.current || nextMutation.isPending) {
      return;
    }

    initialBatchRequestedRef.current = true;
    void nextMutation.mutateAsync();
  }, [nextMutation, questions.length, session]);

  if (sessionQuery.isLoading || !session) {
    if (
      sessionQuery.isError &&
      isApiError(sessionQuery.error) &&
      sessionQuery.error.status === 404
    ) {
      return (
        <EmptyState
          eyebrow="Practice session"
          title="That practice session was not found."
          description="The assessment routes are live, but the requested session id does not belong to the current student account."
          ctaHref="/student/practice"
          ctaLabel="Back to practice"
        />
      );
    }

    if (sessionQuery.isError) {
      return (
        <ErrorState
          title="Practice session could not load."
          description="We couldn't finish restoring the requested practice session from the backend."
          onRetry={() => void sessionQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title="Restoring practice session"
        description="Loading the question queue, draft state, and reveal-aware progress summary."
      />
    );
  }

  if (questions.length === 0) {
    if (session.status === "ACTIVE") {
      return (
        <LoadingState
          title="Requesting the first practice batch"
          description="The session is active and is now pulling its first set of questions from the backend."
        />
      );
    }

    return (
      <EmptyState
        eyebrow="Practice session"
        title="This session has not served any questions yet."
        description="Request the next batch to begin answering, or go back to the practice hub to start a fresh session."
        ctaHref="/student/practice"
        ctaLabel="Back to practice"
      />
    );
  }

  const mutationError =
    (saveMutation.isError && saveMutation.error) ||
    (answerMutation.isError && answerMutation.error) ||
    (revealMutation.isError && revealMutation.error) ||
    (nextMutation.isError && nextMutation.error) ||
    (endMutation.isError && endMutation.error) ||
    null;

  if (!currentQuestion) {
    return (
      <EmptyState
        eyebrow="Practice session"
        title="This session lost its current question pointer."
        description="The local draft state no longer points at a served question, so we’re falling back to the practice hub."
        ctaHref="/student/practice"
        ctaLabel="Back to practice"
      />
    );
  }

  if (session.status !== "ACTIVE") {
    return (
      <div className="flex flex-col gap-6">
        <section className="tc-hero rounded-[32px] p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
                Practice summary
              </p>
              <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {getPracticeModeLabel(session.mode)} session {getPracticeSessionSummaryLabel(session.status).toLowerCase()}.
              </h1>
              <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
                Review the answered questions, preserved reveal results, and the
                accuracy signal before you launch the next practice run.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/student/practice" className="tc-button-primary">
                  Start another session
                </Link>
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={() => clearPracticeSession(sessionId)}
                >
                  Clear local draft copy
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PracticeSummaryMetric
                label="Accuracy"
                value={`${session.accuracyPercent}%`}
              />
              <PracticeSummaryMetric
                label="Answered"
                value={`${session.answeredCount}/${session.servedCount}`}
              />
              <PracticeSummaryMetric
                label="Correct"
                value={String(session.correctCount)}
              />
              <PracticeSummaryMetric
                label="Revealed"
                value={String(session.revealedCount)}
              />
            </div>
          </div>
        </section>

        <section className="tc-panel rounded-[28px] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <PracticeSummaryMetric
              label="Started"
              value={formatAssessmentDate(session.startedAt)}
            />
            <PracticeSummaryMetric
              label="Ended"
              value={formatAssessmentDate(session.endedAt)}
            />
            <PracticeSummaryMetric
              label="Scope"
              value={session.topic?.name ?? session.subject?.name ?? "Mixed"}
            />
          </div>
        </section>

        <div className="grid gap-6">
          {questions.map((question, index) => {
            const status = getQuestionTone(question);
            const draft =
              sessionEntry?.drafts[question.questionId] ??
              normalizeAssessmentDraft(
                question.answerJson ?? question.latestSavedAnswerJson,
              );
            const revealResult =
              sessionEntry?.revealedResults[question.questionId] ?? null;

            return (
              <div key={question.id} className="grid gap-4">
                <AssessmentQuestionCard
                  answerDraft={draft}
                  question={question.question}
                  questionNumber={index + 1}
                  readOnly
                  status={{
                    label: status.chipLabel,
                    tone: status.tone,
                  }}
                />
                {revealResult ? (
                  <AssessmentReviewPanel
                    correctAnswerJson={revealResult.correctAnswerJson}
                    explanationJson={revealResult.explanationJson}
                    question={question.question}
                  />
                ) : null}
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
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Active practice session
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {getPracticeModeLabel(session.mode)} in progress.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Submit answers for immediate correctness, reveal only when needed,
              and load the next batch when you are ready for fresh questions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">{session.servedCount} served</span>
              <span className="tc-stat-chip">{session.answeredCount} answered</span>
              <span className="tc-stat-chip">{session.accuracyPercent}% accuracy</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PracticeSummaryMetric
              label="Correct"
              value={String(session.correctCount)}
            />
            <PracticeSummaryMetric
              label="Wrong"
              value={String(session.wrongCount)}
            />
            <PracticeSummaryMetric
              label="Revealed"
              value={String(session.revealedCount)}
            />
            <PracticeSummaryMetric
              label="Target"
              value={String(session.questionCountTarget)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <div className="grid gap-6">
          {mutationError ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
              {isApiError(mutationError)
                ? mutationError.message
                : "The practice action could not be completed."}
            </div>
          ) : null}

          <AssessmentQuestionCard
            answerDraft={currentDraft}
            question={currentQuestion.question}
            questionNumber={
              currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : 1
            }
            onAnswerChange={(draft) =>
              setPracticeDraft(sessionId, currentQuestion.questionId, draft)
            }
            status={{
              label: getQuestionTone(currentQuestion).chipLabel,
              tone: getQuestionTone(currentQuestion).tone,
            }}
            footer={
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (!currentQuestion) {
                        return;
                      }

                      void saveMutation.mutateAsync({
                        answerJson: currentDraft,
                        questionId: currentQuestion.questionId,
                      });
                    }}
                    disabled={
                      saveMutation.isPending ||
                      Boolean(currentQuestion.answeredAt) ||
                      !hasAssessmentDraft(currentDraft) ||
                      areAssessmentDraftsEqual(currentDraft, currentSyncedDraft)
                    }
                  >
                    {saveMutation.isPending ? "Saving..." : "Save draft"}
                  </button>
                  <button
                    type="button"
                    className="tc-button-primary"
                    onClick={() => {
                      if (!currentQuestion) {
                        return;
                      }

                      void answerMutation.mutateAsync({
                        answerJson: currentDraft,
                        questionId: currentQuestion.questionId,
                        responseTimeMs:
                          sessionEntry?.questionSeenAtMs[currentQuestion.questionId]
                            ? Math.max(
                                0,
                                Date.now() -
                                  sessionEntry.questionSeenAtMs[
                                    currentQuestion.questionId
                                  ],
                              )
                            : null,
                      });
                    }}
                    disabled={
                      answerMutation.isPending ||
                      Boolean(currentQuestion.answeredAt) ||
                      !hasAssessmentDraft(currentDraft)
                    }
                  >
                    {answerMutation.isPending ? "Submitting..." : "Submit answer"}
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (!currentQuestion) {
                        return;
                      }

                      void revealMutation.mutateAsync({
                        questionId: currentQuestion.questionId,
                      });
                    }}
                    disabled={revealMutation.isPending}
                  >
                    {revealMutation.isPending
                      ? "Revealing..."
                      : currentReveal
                        ? "Refresh reveal"
                        : "Reveal answer"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (currentQuestionIndex <= 0) {
                        return;
                      }

                      setPracticeCurrentQuestion(
                        sessionId,
                        questions[currentQuestionIndex - 1]?.questionId ?? null,
                      );
                    }}
                    disabled={currentQuestionIndex <= 0}
                  >
                    Previous question
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      if (currentQuestionIndex < questions.length - 1) {
                        setPracticeCurrentQuestion(
                          sessionId,
                          questions[currentQuestionIndex + 1]?.questionId ?? null,
                        );
                        return;
                      }

                      void nextMutation.mutateAsync();
                    }}
                    disabled={
                      nextMutation.isPending ||
                      (currentQuestionIndex >= questions.length - 1 && !canLoadMore)
                    }
                  >
                    {currentQuestionIndex < questions.length - 1
                      ? "Next question"
                      : nextMutation.isPending
                        ? "Loading..."
                        : canLoadMore
                          ? "Load next batch"
                          : "No more questions"}
                  </button>
                </div>
              </div>
            }
          />

          {currentReveal ? (
            <AssessmentReviewPanel
              correctAnswerJson={currentReveal.correctAnswerJson}
              explanationJson={currentReveal.explanationJson}
              question={currentQuestion.question}
            />
          ) : null}
        </div>

        <div className="grid gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Question queue
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Navigate served questions
                </h2>
              </div>
              <span className="tc-code-chip">{questions.length} loaded</span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {questions.map((question, index) => {
                const tone = getQuestionTone(question);
                const isCurrent = question.questionId === currentQuestion.questionId;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() =>
                      setPracticeCurrentQuestion(sessionId, question.questionId)
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
                  Session actions
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Finish or pause safely
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Started</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatAssessmentDate(session.startedAt)}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Current scope</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {session.topic?.name ?? session.subject?.name ?? "Mixed scope"}
                </p>
              </div>
              <div className="tc-card rounded-[22px] p-4">
                <p className="tc-overline">Last activity</p>
                <p className="mt-2 font-semibold text-[color:var(--brand)]">
                  {formatAssessmentDate(session.lastActivityAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => void endMutation.mutateAsync({})}
                disabled={endMutation.isPending}
              >
                {endMutation.isPending ? "Ending..." : "Finish session"}
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => void endMutation.mutateAsync({ abandon: true })}
                disabled={endMutation.isPending}
              >
                Abandon session
              </button>
              <Link href="/student/practice" className="tc-button-secondary">
                Back to practice hub
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
