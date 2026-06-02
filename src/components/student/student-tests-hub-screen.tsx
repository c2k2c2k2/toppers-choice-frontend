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
  getStudentCatalog,
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
    if (!snapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== snapshot.selectedMedium.code) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
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
        description="Please try again."
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
        description="Loading tests."
      />
    );
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        eyebrow="Timed tests"
        title="No subjects are available yet."
        description="Open the catalog and choose another track."
        ctaHref="/student/catalog"
        ctaLabel="Open catalog"
      />
    );
  }

  const tests = testsQuery.data?.items ?? [];
  const attempts = attemptsQuery.data?.items ?? [];
  const activeAttempt = attempts.find((attempt) => attempt.status === "ACTIVE") ?? null;
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="tc-student-panel rounded-[20px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-overline">Tests</p>
              <h1 className="mt-2 text-2xl font-semibold text-[color:var(--brand)]">
                Test library
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="tc-student-chip" data-tone="soft">
                {tests.length} tests
              </span>
              <span className="tc-student-chip" data-tone="soft">
                {attemptsQuery.data?.total ?? 0} attempts
              </span>
            </div>
          </div>

          {activeAttempt ? (
            <div className="mt-4 rounded-[18px] border border-[rgba(0,51,102,0.14)] bg-[rgba(0,51,102,0.06)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-[color:var(--brand)]">
                  Active attempt
                </p>
                <Link
                  href={`/student/tests/attempts/${activeAttempt.id}`}
                  className="tc-button-primary"
                >
                  Resume
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4">
            <div className="grid gap-3">
              <p className="tc-overline">Family</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tc-filter-chip"
                  data-active={familyFilter === "ALL"}
                  onClick={() => setFamilyFilter("ALL")}
                >
                  All
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
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="tc-student-panel rounded-[20px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-overline">Published</p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--brand)]">
                Choose a test
              </h2>
            </div>
          </div>

          {tests.length > 0 ? (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {tests.map((test) => (
                <article key={test.id} className="tc-student-card rounded-[18px] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tc-student-chip">{getTestFamilyLabel(test.family)}</span>
                    <span className="tc-student-chip">{test.questionCount} questions</span>
                    <span className="tc-student-chip">{test.durationMinutes} min</span>
                  </div>
                  <TextContent
                    as="h3"
                    className="mt-3 text-xl font-semibold text-[color:var(--brand)]"
                    value={test.title}
                  />
                  {test.shortDescription ? (
                    <TextContent
                      as="p"
                      className="tc-muted mt-2 line-clamp-2 text-sm leading-6"
                      value={test.shortDescription}
                    />
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                    <span>{test.maxScore} marks</span>
                    <span>{test.maxAttempts} attempts</span>
                    <span>{test.subject?.name ?? "Mixed scope"}</span>
                  </div>
                  <Link
                    href={`/student/tests/${test.id}`}
                    className="tc-button-primary mt-4"
                  >
                    Open
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="tc-student-card mt-4 rounded-[18px] p-4">
              <p className="font-semibold text-[color:var(--brand)]">
                No tests match this filter.
              </p>
            </div>
          )}
        </section>
      </section>

      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="tc-overline">Attempts</p>
            <h2 className="mt-2 text-xl font-semibold text-[color:var(--brand)]">
              Recent activity
            </h2>
          </div>
          <span className="tc-student-chip" data-tone="soft">
            {attempts.length} shown
          </span>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {attempts.length > 0 ? (
            attempts.map((attempt) => (
              <article key={attempt.id} className="tc-student-card rounded-[18px] p-4">
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
                  <span className="tc-student-chip">{attempt.percentage}%</span>
                </div>
                <p className="tc-muted mt-3 text-sm leading-6">
                  Started {formatTimestamp(attempt.startedAt)}.{" "}
                  {attempt.status === "ACTIVE"
                    ? `Expires ${formatTimestamp(attempt.expiresAt)}.`
                    : `Submitted ${formatTimestamp(attempt.submittedAt)}.`}
                </p>
                <Link
                  href={`/student/tests/attempts/${attempt.id}`}
                  className="tc-button-secondary mt-4"
                >
                  {attempt.status === "ACTIVE" ? "Resume attempt" : "Open result"}
                </Link>
              </article>
            ))
          ) : (
            <div className="tc-student-card rounded-[18px] p-4">
              <p className="font-semibold text-[color:var(--brand)]">
                No test attempts yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
