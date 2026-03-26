"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AssessmentDifficulty } from "@/lib/assessment";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  getPracticeModeLabel,
  getPracticeTrends,
  listPracticeSessions,
  listPracticeSubjectProgress,
  listPracticeTopicProgress,
  listWeakPracticeQuestions,
  PRACTICE_MODE_OPTIONS,
  startPracticeSession,
  type PracticeMode,
} from "@/lib/practice";
import {
  buildStudentCatalogSnapshot,
  flattenTopicTree,
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { buildStudentPlansHref } from "@/lib/payments";
import { useStudentShellStore } from "@/stores";

const QUESTION_COUNT_OPTIONS = [10, 15, 20, 25, 30];
const DIFFICULTY_OPTIONS: Array<{
  label: string;
  value: AssessmentDifficulty | "ALL";
}> = [
  {
    label: "All difficulties",
    value: "ALL",
  },
  {
    label: "Easy",
    value: "EASY",
  },
  {
    label: "Medium",
    value: "MEDIUM",
  },
  {
    label: "Hard",
    value: "HARD",
  },
];

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PracticeMetricCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string;
}>) {
  return (
    <div className="tc-glass rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/72">{detail}</p>
    </div>
  );
}

export function StudentPracticeHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();
  const [mode, setMode] = useState<PracticeMode>("MIXED");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty | "ALL">(
    "ALL",
  );
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const sessionsQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      listPracticeSessions(accessToken, {
        limit: 8,
      }),
    queryKey: queryKeys.student.practiceSessions({
      limit: 8,
      status: null,
    }),
    staleTime: 15_000,
  });

  const snapshot = catalogQuery.data
    ? buildStudentCatalogSnapshot(catalogQuery.data, {
        examTrackCode: activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;

  useEffect(() => {
    if (!snapshot?.selectedTrack?.code || activeExamTrackCode) {
      return;
    }

    setActiveExamTrackCode(snapshot.selectedTrack.code);
  }, [activeExamTrackCode, setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (!snapshot?.selectedMedium?.code || activeMediumCode) {
      return;
    }

    setActiveMediumCode(snapshot.selectedMedium.code);
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  const subjects = snapshot?.subjects ?? [];
  const effectiveSelectedSubjectId =
    selectedSubjectId && subjects.some((subject) => subject.id === selectedSubjectId)
      ? selectedSubjectId
      : "";
  const selectedSubject =
    subjects.find((subject) => subject.id === effectiveSelectedSubjectId) ??
    subjects[0] ??
    null;
  const topicOptions = flattenTopicTree(selectedSubject?.topics ?? []);
  const effectiveSelectedTopicId =
    selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)
      ? selectedTopicId
      : "";
  const selectedTopic =
    topicOptions.find((topic) => topic.id === effectiveSelectedTopicId) ??
    topicOptions[0] ??
    null;

  const subjectProgressQuery = useAuthenticatedQuery({
    enabled: Boolean(snapshot?.selectedTrack?.id),
    queryFn: (accessToken) =>
      listPracticeSubjectProgress(accessToken, {
        examTrackId: snapshot?.selectedTrack?.id ?? null,
      }),
    queryKey: queryKeys.student.practiceSubjectProgress({
      examTrackId: snapshot?.selectedTrack?.id ?? null,
    }),
    staleTime: 30_000,
  });

  const topicProgressQuery = useAuthenticatedQuery({
    enabled: Boolean(snapshot?.selectedTrack?.id && selectedSubject?.id),
    queryFn: (accessToken) =>
      listPracticeTopicProgress(accessToken, {
        examTrackId: snapshot?.selectedTrack?.id ?? null,
        subjectId: selectedSubject?.id ?? null,
      }),
    queryKey: queryKeys.student.practiceTopicProgress({
      examTrackId: snapshot?.selectedTrack?.id ?? null,
      subjectId: selectedSubject?.id ?? null,
    }),
    staleTime: 30_000,
  });

  const weakQuestionsQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      listWeakPracticeQuestions(accessToken, {
        limit: 6,
        subjectId: selectedSubject?.id ?? null,
      }),
    queryKey: queryKeys.student.practiceWeakQuestions({
      limit: 6,
      subjectId: selectedSubject?.id ?? null,
      topicId: null,
    }),
    staleTime: 30_000,
  });

  const trendsQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      getPracticeTrends(accessToken, {
        days: 7,
      }),
    queryKey: queryKeys.student.practiceTrends({
      days: 7,
    }),
    staleTime: 30_000,
  });

  const startMutation = useAuthenticatedMutation({
    mutationFn: (input: Parameters<typeof startPracticeSession>[0], accessToken) =>
      startPracticeSession(input, accessToken),
    onSuccess: async (session) => {
      setInlineMessage(null);
      await queryClient.invalidateQueries({
        queryKey: ["student", "practice"],
      });
      router.push(`/student/practice/session/${session.id}`);
    },
  });

  if (catalogQuery.isError || sessionsQuery.isError) {
    return (
      <ErrorState
        title="Practice workspace could not load."
        description="We couldn't finish loading the student catalog scope and recent practice state."
        onRetry={() => {
          void catalogQuery.refetch();
          void sessionsQuery.refetch();
        }}
      />
    );
  }

  if (catalogQuery.isLoading || sessionsQuery.isLoading || !snapshot) {
    return (
      <LoadingState
        title="Preparing practice workspace"
        description="Loading the student catalog scope, recent sessions, and weak-area signals."
      />
    );
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        eyebrow="Practice"
        title="Practice needs published subject taxonomy first."
        description="The assessment surface is ready, but there are no published subjects in the current track yet, so we cannot scope question drilling safely."
        ctaHref="/student/catalog"
        ctaLabel="Open catalog"
      />
    );
  }

  const activeSession =
    sessionsQuery.data?.items.find((item) => item.status === "ACTIVE") ?? null;
  const completedSessions =
    sessionsQuery.data?.items.filter((item) => item.status !== "ACTIVE") ?? [];
  const subjectProgress = subjectProgressQuery.data?.items ?? [];
  const topicProgress = topicProgressQuery.data?.items ?? [];
  const weakQuestions = weakQuestionsQuery.data?.items ?? [];
  const trends = trendsQuery.data?.items ?? [];
  const practicedQuestionCount = trends.reduce(
    (total, item) => total + item.answeredCount,
    0,
  );

  async function handleStartPractice() {
    if (!snapshot) {
      return;
    }

    setInlineMessage(null);

    if (mode === "TOPIC_WISE" && !selectedTopic) {
      setInlineMessage("Select a topic before starting topic-wise practice.");
      return;
    }

    await startMutation.mutateAsync({
      difficulty: difficulty === "ALL" ? null : difficulty,
      examTrackId: snapshot.selectedTrack?.id ?? null,
      mediumId: snapshot.selectedMedium?.id ?? null,
      mode,
      questionCount,
      subjectId: selectedSubject?.id ?? null,
      topicId: mode === "TOPIC_WISE" ? selectedTopic?.id ?? null : null,
    });
  }

  const mutationMessage = startMutation.isError
    ? isApiError(startMutation.error)
      ? startMutation.error.message
      : "The practice session could not be started."
    : inlineMessage;

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Practice workspace
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Repair weak areas before they become repeat mistakes.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Practice stays intentionally separate from timed tests: smaller
              decision loops, immediate correctness feedback, optional reveal,
              and topic-first recovery when you want deliberate repetition.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {getMediumLabel(snapshot.selectedMedium)}
              </span>
              <span className="tc-stat-chip">
                {subjects.length} scoped subjects
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {activeSession ? (
                <Link
                  href={`/student/practice/session/${activeSession.id}`}
                  className="tc-button-primary"
                >
                  Resume active session
                </Link>
              ) : (
                <button
                  type="button"
                  className="tc-button-primary"
                  onClick={() => void handleStartPractice()}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? "Starting practice..." : "Start practice"}
                </button>
              )}
              <Link href="/student/tests" className="tc-button-secondary">
                Switch to timed tests
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PracticeMetricCard
              label="Recent attempts"
              value={String(practicedQuestionCount)}
              detail="Questions answered in the last 7 days"
            />
            <PracticeMetricCard
              label="Weak question queue"
              value={String(weakQuestionsQuery.data?.total ?? 0)}
              detail="Questions still showing wrong or reveal-heavy patterns"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="tc-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Start session
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Configure a focused practice run
              </h2>
            </div>
            {activeSession ? <span className="tc-code-chip">1 active</span> : null}
          </div>

          <div className="mt-5 grid gap-5">
            <div className="grid gap-3">
              <p className="tc-overline">Practice mode</p>
              <div className="grid gap-3">
                {PRACTICE_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="tc-card rounded-[24px] p-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
                    onClick={() => setMode(option.value)}
                    style={{
                      border:
                        mode === option.value
                          ? "1px solid rgba(0, 51, 102, 0.24)"
                          : "1px solid rgba(0, 30, 64, 0.06)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[color:var(--brand)]">
                        {option.label}
                      </p>
                      <span className="tc-code-chip">
                        {mode === option.value ? "Selected" : "Available"}
                      </span>
                    </div>
                    <p className="tc-muted mt-2 text-sm leading-6">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <label className="tc-form-field">
              <span className="tc-form-label">Subject focus</span>
              <select
                className="tc-input"
                value={selectedSubject?.id ?? ""}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            {mode === "TOPIC_WISE" ? (
              <label className="tc-form-field">
                <span className="tc-form-label">Topic focus</span>
                <select
                  className="tc-input"
                  value={selectedTopic?.id ?? ""}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                >
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="tc-form-field">
                <span className="tc-form-label">Question count</span>
                <select
                  className="tc-input"
                  value={String(questionCount)}
                  onChange={(event) =>
                    setQuestionCount(Number.parseInt(event.target.value, 10))
                  }
                >
                  {QUESTION_COUNT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} questions
                    </option>
                  ))}
                </select>
              </label>

              <label className="tc-form-field">
                <span className="tc-form-label">Difficulty</span>
                <select
                  className="tc-input"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as AssessmentDifficulty | "ALL")
                  }
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {mutationMessage ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                {mutationMessage}
                {isApiError(startMutation.error) &&
                startMutation.error.code === "PRACTICE_ACCESS_DENIED" ? (
                  <div className="mt-4">
                    <Link
                      href={buildStudentPlansHref({
                        intent: "practice",
                        returnTo: "/student/practice",
                        source: "practice-start",
                      })}
                      className="tc-button-primary"
                    >
                      View plans
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => void handleStartPractice()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? "Starting..." : "Start new session"}
              </button>
              {activeSession ? (
                <Link
                  href={`/student/practice/session/${activeSession.id}`}
                  className="tc-button-secondary"
                >
                  Resume {getPracticeModeLabel(activeSession.mode)}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Performance summary
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Subject and topic signals
                </h2>
              </div>
              <span className="tc-code-chip">{subjectProgress.length} subjects</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {subjectProgressQuery.isError ? (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    Subject progress is temporarily unavailable.
                  </p>
                </div>
              ) : subjectProgress.length > 0 ? (
                subjectProgress.slice(0, 4).map((item) => (
                  <button
                    key={item.subject.id}
                    type="button"
                    className="tc-card rounded-[24px] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                    onClick={() => setSelectedSubjectId(item.subject.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                        {item.subject.name}
                      </h3>
                      <span className="tc-code-chip">{item.accuracyPercent}%</span>
                    </div>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      {item.correctCount} correct, {item.wrongCount} wrong,{" "}
                      {item.revealCount} reveals
                    </p>
                  </button>
                ))
              ) : (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    No practice history yet.
                  </p>
                  <p className="tc-muted mt-2 text-sm leading-6">
                    Start a session to unlock subject accuracy and weak-area
                    summaries here.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {topicProgress.length > 0 ? (
                topicProgress.slice(0, 4).map((item) => (
                  <button
                    key={item.topic.id}
                    type="button"
                    className="tc-card rounded-[24px] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                    onClick={() => {
                      setMode("TOPIC_WISE");
                      setSelectedSubjectId(item.subject.id);
                      setSelectedTopicId(item.topic.id);
                    }}
                  >
                    <p className="tc-overline">{selectedSubject?.name ?? "Topic focus"}</p>
                    <h3 className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                      {item.topic.name}
                    </h3>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      {item.correctCount} correct, {item.wrongCount} wrong,{" "}
                      {item.revealCount} reveals
                    </p>
                  </button>
                ))
              ) : (
                <div className="tc-card rounded-[24px] p-5 md:col-span-2">
                  <p className="font-semibold text-[color:var(--brand)]">
                    Topic trends will appear after subject-focused sessions.
                  </p>
                  <p className="tc-muted mt-2 text-sm leading-6">
                    Pick a subject and complete a few questions to unlock
                    topic-level repair suggestions.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="tc-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Weak-area queue
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Jump directly into the mistakes worth fixing
              </h2>
            </div>
            <span className="tc-code-chip">{weakQuestions.length} items</span>
          </div>

          <div className="mt-5 grid gap-4">
            {weakQuestionsQuery.isError ? (
              <div className="tc-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  Weak-question analysis is temporarily unavailable.
                </p>
              </div>
            ) : weakQuestions.length > 0 ? (
              weakQuestions.map((question) => (
                <article key={question.questionId} className="tc-card rounded-[24px] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="tc-code-chip">{question.subject.name}</span>
                      {question.topic ? (
                        <span className="tc-code-chip">{question.topic.name}</span>
                      ) : null}
                      <span className="tc-code-chip">{question.difficulty}</span>
                    </div>
                    <span className="tc-code-chip">{question.accuracyPercent}%</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--brand)]">
                    {question.code ?? "Question"} still shows {question.wrongCount} wrong
                    attempt{question.wrongCount === 1 ? "" : "s"} and{" "}
                    {question.revealCount} reveal{question.revealCount === 1 ? "" : "s"}.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="tc-button-secondary"
                      onClick={() => {
                        setSelectedSubjectId(question.subject.id);
                        if (question.topic) {
                          setMode("TOPIC_WISE");
                          setSelectedTopicId(question.topic.id);
                        } else {
                          setMode("MIXED");
                        }
                        setInlineMessage(
                          "The start form is now focused on the weak area you selected.",
                        );
                      }}
                    >
                      Focus this area
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="tc-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  No weak-question queue yet.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Once you start answering and revealing practice questions,
                  this panel will surface repair-worthy items automatically.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Trend window
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Seven-day activity
                </h2>
              </div>
              <span className="tc-code-chip">7 days</span>
            </div>

            <div className="mt-5 grid gap-3">
              {trendsQuery.isError ? (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    Practice trend analytics are temporarily unavailable.
                  </p>
                </div>
              ) : trends.length > 0 ? (
                trends.map((item) => (
                  <div
                    key={item.date}
                    className="tc-card rounded-[22px] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--brand)]">
                          {item.date}
                        </p>
                        <p className="tc-muted mt-1 text-sm">
                          {item.answeredCount} answered, {item.correctCount} correct,{" "}
                          {item.revealedCount} reveals
                        </p>
                      </div>
                      <span className="tc-code-chip">{item.servedCount} served</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    Trend cards will appear after the first session.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Session history
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Resume or review recent practice
                </h2>
              </div>
              <span className="tc-code-chip">
                {sessionsQuery.data?.total ?? 0} total
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {activeSession ? (
                <article className="tc-card rounded-[24px] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="tc-overline">Active session</p>
                      <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                        {getPracticeModeLabel(activeSession.mode)}
                      </h3>
                    </div>
                    <span className="tc-code-chip">{activeSession.answeredCount} answered</span>
                  </div>
                  <p className="tc-muted mt-3 text-sm leading-6">
                    Started {formatTimestamp(activeSession.startedAt)}. Accuracy so far:{" "}
                    {activeSession.accuracyPercent}%.
                  </p>
                  <Link
                    href={`/student/practice/session/${activeSession.id}`}
                    className="tc-button-primary mt-4"
                  >
                    Resume session
                  </Link>
                </article>
              ) : null}

              {completedSessions.length > 0 ? (
                completedSessions.slice(0, 3).map((session) => (
                  <article key={session.id} className="tc-card rounded-[24px] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="tc-overline">{session.status.toLowerCase()}</p>
                        <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                          {getPracticeModeLabel(session.mode)}
                        </h3>
                      </div>
                      <span className="tc-code-chip">{session.accuracyPercent}%</span>
                    </div>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      Ended {formatTimestamp(session.endedAt)}. {session.correctCount} correct
                      out of {session.answeredCount} answered.
                    </p>
                    <Link
                      href={`/student/practice/session/${session.id}`}
                      className="tc-button-secondary mt-4"
                    >
                      Open summary
                    </Link>
                  </article>
                ))
              ) : (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="font-semibold text-[color:var(--brand)]">
                    No completed practice sessions yet.
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
