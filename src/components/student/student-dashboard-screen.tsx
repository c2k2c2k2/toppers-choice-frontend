"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import { STUDENT_STRUCTURED_SURFACE_LINKS } from "@/lib/content";
import {
  buildStudentCatalogSnapshot,
  buildSubjectCatalogHref,
  countTopics,
  getMediumLabel,
  getOptionalText,
  getStudentDashboardBootstrap,
  getTrackLabel,
} from "@/lib/student";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";
import { useStudentShellStore } from "@/stores";

function buildCatalogHref(
  trackCode: string | null,
  mediumCode: string | null,
) {
  const searchParams = new URLSearchParams();

  if (trackCode) {
    searchParams.set("track", trackCode);
  }

  if (mediumCode) {
    searchParams.set("medium", mediumCode);
  }

  const queryString = searchParams.toString();
  return queryString ? `/student/catalog?${queryString}` : "/student/catalog";
}

function formatSubscriptionDate(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return "No paid plan yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function StudentMetricCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string;
}>) {
  return (
    <article className="tc-student-metric rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="tc-display mt-4 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/72">{detail}</p>
    </article>
  );
}

function SelectionRail({
  activeCode,
  emptyLabel,
  items,
  onSelect,
}: Readonly<{
  activeCode: string | null;
  emptyLabel: string;
  items: Array<{
    code: string;
    name: string;
  }>;
  onSelect: (code: string) => void;
}>) {
  if (items.length === 0) {
    return <span className="tc-code-chip">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.code}
          type="button"
          className="tc-filter-chip"
          data-active={activeCode === item.code}
          onClick={() => onSelect(item.code)}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

export function StudentDashboardScreen() {
  const {
    activeExamTrackCode,
    activeMediumCode,
    lastCatalogSubjectSlug,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();

  const dashboardQuery = useAuthenticatedQuery({
    queryKey: queryKeys.student.dashboard(),
    queryFn: getStudentDashboardBootstrap,
    staleTime: 60_000,
  });

  const dashboardData = dashboardQuery.data;
  const snapshot = dashboardData
    ? buildStudentCatalogSnapshot(dashboardData.catalog, {
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

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="The student dashboard could not load."
        description="We couldn't load your latest study summary right now."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (dashboardQuery.isLoading || !dashboardData || !snapshot) {
    return (
      <LoadingState
        title="Loading dashboard"
        description="Getting your subjects, updates, notifications, and progress."
      />
    );
  }

  const featuredSubjects = snapshot.subjects.slice(0, 4);
  const lastSubject =
    lastCatalogSubjectSlug
      ? dashboardData.catalog.subjects.find(
          (subject) => subject.slug === lastCatalogSubjectSlug,
        ) ?? null
      : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Student dashboard
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Choose your track and continue your preparation.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Select your exam track and medium once, then move to notes, practice, tests, and updates without repeating the same setup on every page.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {getMediumLabel(snapshot.selectedMedium)}
              </span>
              <span className="tc-stat-chip">
                {snapshot.subjects.length} subjects ready
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={buildCatalogHref(
                  snapshot.selectedTrack?.code ?? null,
                  snapshot.selectedMedium?.code ?? null,
                )}
                className="tc-button-primary"
              >
                Explore catalog
              </Link>
              {lastSubject ? (
                <Link
                  href={buildSubjectCatalogHref(lastSubject, {
                    examTrackCode: snapshot.selectedTrack?.code ?? null,
                    mediumCode: snapshot.selectedMedium?.code ?? null,
                  })}
                  className="tc-button-secondary"
                >
                  Resume {lastSubject.name}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <StudentMetricCard
              label="Notes progress"
              value={String(dashboardData.analytics.notes.startedCount)}
              detail={`${dashboardData.analytics.notes.completedCount} notes completed`}
            />
            <StudentMetricCard
              label="Practice accuracy"
              value={`${dashboardData.analytics.practice.accuracyPercent}%`}
              detail={`${dashboardData.analytics.practice.completedSessions} practice sessions finished`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="tc-student-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Catalog focus
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Pick your exam track and study medium once for the whole app.
          </h2>
          <div className="mt-5 flex flex-col gap-5">
            <div className="space-y-3">
              <p className="tc-overline">Exam track</p>
              <SelectionRail
                activeCode={snapshot.selectedTrack?.code ?? null}
                emptyLabel="No tracks published yet"
                items={dashboardData.catalog.examTracks.map((examTrack) => ({
                  code: examTrack.code,
                  name: getTrackLabel(examTrack),
                }))}
                onSelect={setActiveExamTrackCode}
              />
            </div>
            <div className="space-y-3">
              <p className="tc-overline">Study medium</p>
              <SelectionRail
                activeCode={snapshot.selectedMedium?.code ?? null}
                emptyLabel="No mediums published yet"
                items={dashboardData.catalog.mediums.map((medium) => ({
                  code: medium.code,
                  name: medium.name,
                }))}
                onSelect={setActiveMediumCode}
              />
            </div>
          </div>
        </div>

        <div className="tc-student-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Student account
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="tc-student-card rounded-[22px] p-4">
              <p className="tc-overline">Unread updates</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.unreadNotifications}
              </p>
              <p className="tc-muted mt-2 text-sm">
                Academy announcements and personal messages appear here.
              </p>
            </div>
            <div className="tc-student-card rounded-[22px] p-4">
              <p className="tc-overline">Entitlements</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.activeEntitlements}
              </p>
              <p className="tc-muted mt-2 text-sm">
                Current plan ends {formatSubscriptionDate(
                  dashboardData.analytics.currentSubscription.endsAt,
                )}
              </p>
            </div>
            <div className="tc-student-card rounded-[22px] p-4">
              <p className="tc-overline">Best test score</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.tests.bestPercentage}%
              </p>
              <p className="tc-muted mt-2 text-sm">
                {dashboardData.analytics.tests.submittedAttempts} submitted attempts
              </p>
            </div>
            <div className="tc-student-card rounded-[22px] p-4">
              <p className="tc-overline">Quick action path</p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                Open catalog
              </p>
              <p className="tc-muted mt-2 text-sm">
                Your selected track and medium will be reused in notes, practice, tests, and plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="tc-student-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Academy announcements
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Latest updates from the academy
              </h2>
            </div>
            <span className="tc-code-chip">
              {dashboardData.cms.announcements.length} items
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {dashboardData.cms.announcements.length > 0 ? (
              dashboardData.cms.announcements.slice(0, 3).map((announcement) => {
                const linkHref = getOptionalText(announcement.linkHref);
                const linkLabel = getOptionalText(announcement.linkLabel);

                return (
                  <article key={announcement.id} className="tc-student-card rounded-[24px] p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <TextContent
                        as="h3"
                        className="text-lg font-semibold text-[color:var(--brand)]"
                        value={announcement.title}
                      />
                      <span className="tc-nav-badge" data-status="live">
                        {announcement.level.toLowerCase()}
                      </span>
                    </div>
                    <TextContent
                      as="p"
                      className="tc-muted mt-3 text-sm leading-6"
                      preserveLineBreaks
                      value={announcement.body}
                    />
                    {linkHref && linkLabel ? (
                      <Link
                        href={linkHref}
                        className="tc-button-secondary mt-4"
                      >
                        <TextContent as="span" value={linkLabel} />
                      </Link>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="tc-student-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  No student announcements are published yet.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  New announcements will appear here as soon as they are published.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="tc-student-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Personal inbox
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Notification feed
              </h2>
            </div>
            <span className="tc-code-chip">
              {dashboardData.notifications.unreadCount} unread
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {dashboardData.notifications.items.length > 0 ? (
              dashboardData.notifications.items.slice(0, 4).map((message) => (
                <article key={message.id} className="tc-student-card rounded-[24px] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <TextContent
                      as="h3"
                      className="text-lg font-semibold text-[color:var(--brand)]"
                      value={message.title}
                    />
                    <span className="tc-code-chip">{message.channel}</span>
                  </div>
                  <TextContent
                    as="p"
                    className="tc-muted mt-3 text-sm leading-6"
                    preserveLineBreaks
                    value={message.body}
                  />
                </article>
              ))
            ) : (
              <div className="tc-student-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  Your notification inbox is clear for now.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  New broadcasts and account messages will show up here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tc-student-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Assessment launchpad
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Move from revision to testing when you&apos;re ready.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/student/practice" className="tc-button-secondary">
              Open practice
            </Link>
            <Link href="/student/tests" className="tc-button-primary">
              Open timed tests
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <article className="tc-student-card rounded-[24px] p-5">
            <p className="tc-overline">Practice mode</p>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              Practice mode
            </h3>
            <p className="tc-muted mt-3 text-sm leading-6">
              Use practice when you want quick topic revision and answer-by-answer feedback.
            </p>
          </article>

          <article className="tc-student-card rounded-[24px] p-5">
            <p className="tc-overline">Timed mode</p>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              Timed tests
            </h3>
            <p className="tc-muted mt-3 text-sm leading-6">
              Timed tests keep the experience closer to a real exam and show results after submission.
            </p>
          </article>

          <article className="tc-student-card rounded-[24px] p-5">
            <p className="tc-overline">Shared scope</p>
            <h3 className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              One study setup
            </h3>
            <p className="tc-muted mt-3 text-sm leading-6">
              Your selected track and medium stay in sync across the main student sections.
            </p>
          </article>
        </div>
      </section>

      <section className="tc-student-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Structured learning
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Open extra guidance and skill-building modules.
            </h2>
          </div>
          <Link href="/student/guidance" className="tc-button-secondary">
            Open learning hub
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          {STUDENT_STRUCTURED_SURFACE_LINKS.map((surface) => (
            <Link
              key={surface.href}
              href={surface.href}
              className="tc-student-card rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="tc-overline">Student route</p>
              <h3 className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                {surface.label}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-6">
                {surface.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="tc-student-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Subject launchpad
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Start with a subject.
            </h2>
          </div>
          <Link
            href={buildCatalogHref(
              snapshot.selectedTrack?.code ?? null,
              snapshot.selectedMedium?.code ?? null,
            )}
            className="tc-button-secondary"
          >
            Open full catalog
          </Link>
        </div>

        {featuredSubjects.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {featuredSubjects.map((subject) => (
              <Link
                key={subject.id}
                href={buildSubjectCatalogHref(subject, {
                  examTrackCode: snapshot.selectedTrack?.code ?? null,
                  mediumCode: snapshot.selectedMedium?.code ?? null,
                })}
                className="tc-student-card rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                    {subject.name}
                  </h3>
                  <span className="tc-code-chip">{subject.code}</span>
                </div>
                <p className="tc-muted mt-3 text-sm leading-6">
                  {getOptionalText(subject.description) ??
                    "Open this subject to continue with notes, practice, and tests."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                  <span>{countTopics(subject.topics)} topics</span>
                  <span>Track scoped</span>
                  <span>{getMediumLabel(snapshot.selectedMedium)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="tc-student-card mt-5 rounded-[24px] p-5">
            <p className="font-semibold text-[color:var(--brand)]">
              No subjects are published for the current selection yet.
            </p>
            <p className="tc-muted mt-2 text-sm leading-6">
              New subjects will appear here as soon as they are published for your selected track and medium.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
