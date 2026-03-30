"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  getTestAttemptStatusLabel,
  getTestFamilyLabel,
  listPublishedTests,
  listTestAttempts,
  TEST_FAMILY_OPTIONS,
  type TestFamily,
} from "@/lib/tests";
import {
  buildStudentCatalogSnapshot,
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { TextContent } from "@/components/primitives/text-content";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { useStudentShellStore } from "@/stores";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TestsMetricCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string;
}>) {
  return (
    <div className="tc-student-metric rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/72">{detail}</p>
    </div>
  );
}

export function StudentTestsHubScreen() {
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();
  const [familyFilter, setFamilyFilter] = useState<TestFamily | "ALL">("ALL");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
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
  const effectiveSubjectFilter =
    subjectFilter && subjects.some((subject) => subject.id === subjectFilter)
      ? subjectFilter
      : "";

  const testsQuery = useAuthenticatedQuery({
    enabled: Boolean(snapshot?.selectedTrack?.id),
    queryFn: (accessToken) =>
      listPublishedTests(accessToken, {
        examTrackId: snapshot?.selectedTrack?.id ?? null,
        family: familyFilter === "ALL" ? null : familyFilter,
        mediumId: snapshot?.selectedMedium?.id ?? null,
        subjectId: effectiveSubjectFilter || null,
      }),
    queryKey: queryKeys.student.tests({
      accessType: null,
      examTrackId: snapshot?.selectedTrack?.id ?? null,
      family: familyFilter === "ALL" ? null : familyFilter,
      mediumId: snapshot?.selectedMedium?.id ?? null,
      subjectId: effectiveSubjectFilter || null,
    }),
    staleTime: 30_000,
  });

  const attemptsQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      listTestAttempts(accessToken, {
        limit: 8,
      }),
    queryKey: queryKeys.student.testAttempts({
      limit: 8,
      status: null,
      testId: null,
    }),
    staleTime: 15_000,
  });

  if (catalogQuery.isError || testsQuery.isError || attemptsQuery.isError) {
    return (
      <ErrorState
        title="Timed tests could not load."
        description="We couldn't finish loading the published tests and recent attempt history."
        onRetry={() => {
          void catalogQuery.refetch();
          void testsQuery.refetch();
          void attemptsQuery.refetch();
        }}
      />
    );
  }

  if (
    catalogQuery.isLoading ||
    testsQuery.isLoading ||
    attemptsQuery.isLoading ||
    !snapshot
  ) {
    return (
      <LoadingState
        title="Preparing timed tests"
        description="Loading the published test catalog, active attempt state, and recent result history."
      />
    );
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        eyebrow="Timed tests"
        title="Timed tests need published subject taxonomy first."
        description="The timed-assessment shell is ready, but the current track does not have published subjects yet."
        ctaHref="/student/catalog"
        ctaLabel="Open catalog"
      />
    );
  }

  const tests = testsQuery.data?.items ?? [];
  const attempts = attemptsQuery.data?.items ?? [];
  const activeAttempt = attempts.find((attempt) => attempt.status === "ACTIVE") ?? null;
  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Timed tests
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Sit for the clock only when you are ready for pressure.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Timed tests stay stricter than practice: no correctness before
              submission, explicit attempt instructions, autosaved drafts, and a
              full result review only after the clock stops.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {getMediumLabel(snapshot.selectedMedium)}
              </span>
              <span className="tc-stat-chip">{tests.length} published tests</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {activeAttempt ? (
                <Link
                  href={`/student/tests/attempts/${activeAttempt.id}`}
                  className="tc-button-primary"
                >
                  Resume active attempt
                </Link>
              ) : null}
              <Link href="/student/practice" className="tc-button-secondary">
                Switch to practice
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TestsMetricCard
              label="Published tests"
              value={String(tests.length)}
              detail="Visible in the current track and medium scope"
            />
            <TestsMetricCard
              label="Attempt history"
              value={String(attemptsQuery.data?.total ?? 0)}
              detail="Recent attempts available for review"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="tc-student-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Test filters
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Narrow the test library
              </h2>
            </div>
            <span className="tc-code-chip">{tests.length} items</span>
          </div>

          <div className="mt-5 grid gap-5">
            <div className="grid gap-3">
              <p className="tc-overline">Family</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tc-filter-chip"
                  data-active={familyFilter === "ALL"}
                  onClick={() => setFamilyFilter("ALL")}
                >
                  All families
                </button>
                {TEST_FAMILY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="tc-filter-chip"
                    data-active={familyFilter === option.value}
                    onClick={() => setFamilyFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="tc-form-field">
              <span className="tc-form-label">Subject</span>
              <select
                className="tc-input"
                value={effectiveSubjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option value="">All scoped subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            {activeAttempt ? (
              <div className="rounded-[24px] border border-[rgba(0,51,102,0.14)] bg-[rgba(0,51,102,0.06)] px-4 py-4">
                <p className="font-semibold text-[color:var(--brand)]">
                  An active attempt is already running.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Resume it before starting another attempt for the same test.
                </p>
                <Link
                  href={`/student/tests/attempts/${activeAttempt.id}`}
                  className="tc-button-primary mt-4"
                >
                  Resume active attempt
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="tc-student-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Published tests
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Open instructions before the timer starts
              </h2>
            </div>
          </div>

          {tests.length > 0 ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {tests.map((test) => (
                <article key={test.id} className="tc-student-card rounded-[24px] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tc-code-chip">{getTestFamilyLabel(test.family)}</span>
                    <span className="tc-code-chip">{test.questionCount} questions</span>
                    <span className="tc-code-chip">{test.durationMinutes} min</span>
                    <span className="tc-code-chip">{test.access.mode}</span>
                  </div>
                  <TextContent
                    as="h3"
                    className="mt-4 text-xl font-semibold text-[color:var(--brand)]"
                    value={test.title}
                  />
                  <TextContent
                    as="p"
                    className="tc-muted mt-3 text-sm leading-6"
                    value={
                      test.shortDescription ??
                      "The test detail route will show instructions, attempt rules, and the correct start/resume action."
                    }
                  />
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                    <span>{test.maxScore} marks</span>
                    <span>{test.maxAttempts} attempts</span>
                    <span>{test.subject?.name ?? "Mixed scope"}</span>
                  </div>
                  <Link
                    href={`/student/tests/${test.id}`}
                    className="tc-button-primary mt-5"
                  >
                    Open instructions
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="tc-student-card mt-5 rounded-[24px] p-5">
              <p className="font-semibold text-[color:var(--brand)]">
                No published tests match the current filter.
              </p>
              <p className="tc-muted mt-2 text-sm leading-6">
                Try another family or subject, or wait for the academic team to
                publish timed tests in this scope.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className="tc-student-panel rounded-[28px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Attempt history
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Resume or review recent attempts
            </h2>
          </div>
          <span className="tc-code-chip">{attempts.length} shown</span>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {attempts.length > 0 ? (
            attempts.map((attempt) => (
              <article key={attempt.id} className="tc-student-card rounded-[24px] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="tc-overline">
                      {getTestAttemptStatusLabel(attempt.status)}
                    </p>
                    <TextContent
                      as="h3"
                      className="mt-2 text-lg font-semibold text-[color:var(--brand)]"
                      value={attempt.testSnapshot.title}
                    />
                  </div>
                  <span className="tc-code-chip">{attempt.percentage}%</span>
                </div>
                <p className="tc-muted mt-3 text-sm leading-6">
                  Started {formatTimestamp(attempt.startedAt)}.{" "}
                  {attempt.status === "ACTIVE"
                    ? `Expires ${formatTimestamp(attempt.expiresAt)}.`
                    : `Submitted ${formatTimestamp(attempt.submittedAt)}.`}
                </p>
                <Link
                  href={`/student/tests/attempts/${attempt.id}`}
                  className="tc-button-secondary mt-5"
                >
                  {attempt.status === "ACTIVE" ? "Resume attempt" : "Open result"}
                </Link>
              </article>
            ))
          ) : (
            <div className="tc-student-card rounded-[24px] p-5">
              <p className="font-semibold text-[color:var(--brand)]">
                No test attempts yet.
              </p>
              <p className="tc-muted mt-2 text-sm leading-6">
                Start a timed test to unlock result review and attempt history.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
