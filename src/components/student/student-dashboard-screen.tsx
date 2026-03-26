"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
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
    <article className="tc-glass rounded-[24px] p-5">
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
        description="We couldn't finish loading the student catalog foundation from the backend contracts."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (dashboardQuery.isLoading || !dashboardData || !snapshot) {
    return (
      <LoadingState
        title="Preparing the student dashboard"
        description="Loading the catalog, announcements, notifications, and student progress summaries."
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
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Student dashboard
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Learn from the right track before you open a single note.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              The protected student surface now loads the real catalog,
              analytics, CMS announcements, and personal notification feed in
              one mobile-first dashboard.
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
              detail={`${dashboardData.analytics.notes.completedCount} completed notes`}
            />
            <StudentMetricCard
              label="Practice accuracy"
              value={`${dashboardData.analytics.practice.accuracyPercent}%`}
              detail={`${dashboardData.analytics.practice.completedSessions} completed practice sessions`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="tc-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Catalog focus
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Pick your exam track and study medium once for the whole student app.
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

        <div className="tc-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Student account
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Unread updates</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.unreadNotifications}
              </p>
              <p className="tc-muted mt-2 text-sm">
                Personal message feed is ready for mark-read behavior next.
              </p>
            </div>
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Entitlements</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.activeEntitlements}
              </p>
              <p className="tc-muted mt-2 text-sm">
                Subscription ends {formatSubscriptionDate(
                  dashboardData.analytics.currentSubscription.endsAt,
                )}
              </p>
            </div>
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Best test score</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {dashboardData.analytics.tests.bestPercentage}%
              </p>
              <p className="tc-muted mt-2 text-sm">
                {dashboardData.analytics.tests.submittedAttempts} submitted attempts
              </p>
            </div>
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Quick action path</p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                Catalog first
              </p>
              <p className="tc-muted mt-2 text-sm">
                Notes, practice, tests, and plans will reuse this selected track
                and medium context.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="tc-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Academy announcements
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                CMS-driven updates for the student surface
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
                  <article key={announcement.id} className="tc-card rounded-[24px] p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                        {announcement.title}
                      </h3>
                      <span className="tc-nav-badge" data-status="live">
                        {announcement.level.toLowerCase()}
                      </span>
                    </div>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      {announcement.body}
                    </p>
                    {linkHref && linkLabel ? (
                      <Link
                        href={linkHref}
                        className="tc-button-secondary mt-4"
                      >
                        {linkLabel}
                      </Link>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="tc-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  No student announcements are published yet.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  The dashboard is already wired to `GET /cms/student/resolve`,
                  so any future announcement or banner will appear here without
                  changing the route structure.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="tc-panel rounded-[28px] p-6">
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
                <article key={message.id} className="tc-card rounded-[24px] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                      {message.title}
                    </h3>
                    <span className="tc-code-chip">{message.channel}</span>
                  </div>
                  <p className="tc-muted mt-3 text-sm leading-6">
                    {message.body}
                  </p>
                </article>
              ))
            ) : (
              <div className="tc-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">
                  Your notification inbox is clear for now.
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Backend delivery and read tracking are already connected, so
                  future broadcasts and account messages will flow into this
                  panel automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tc-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Subject launchpad
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Start navigating the catalog before feature modules open.
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
                className="tc-card rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                    {subject.name}
                  </h3>
                  <span className="tc-code-chip">{subject.code}</span>
                </div>
                <p className="tc-muted mt-3 text-sm leading-6">
                  {getOptionalText(subject.description) ??
                    "Catalog navigation is ready for notes, structured content, practice, and tests."}
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
          <div className="tc-card mt-5 rounded-[24px] p-5">
            <p className="font-semibold text-[color:var(--brand)]">
              No subjects are published for the current selection yet.
            </p>
            <p className="tc-muted mt-2 text-sm leading-6">
              Once taxonomy data lands, the same dashboard panel will become the
              launchpad for notes, practice, and test modules without changing
              the student route layout.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
