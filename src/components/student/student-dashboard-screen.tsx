"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  buildStudentCatalogSnapshot,
  buildSubjectNotesHref,
  flattenTopicTree,
  getStudentDashboardBootstrap,
  getTrackLabel,
  type StudentSubject,
} from "@/lib/student";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";
import { useStudentShellStore } from "@/stores";

function buildCatalogHref(trackCode: string | null) {
  const searchParams = new URLSearchParams();

  if (trackCode) {
    searchParams.set("track", trackCode);
  }

  const queryString = searchParams.toString();
  return queryString ? `/student/catalog?${queryString}` : "/student/catalog";
}

function formatSubscriptionDate(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return "No plan";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getPlainText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function TrackPicker({
  activeCode,
  items,
  onSelect,
}: Readonly<{
  activeCode: string | null;
  items: Array<{
    code: string;
    name: string;
  }>;
  onSelect: (code: string) => void;
}>) {
  if (items.length === 0) {
    return <span className="tc-student-chip" data-tone="soft">No tracks</span>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.code}
          type="button"
          className="tc-filter-chip shrink-0"
          data-active={activeCode === item.code}
          onClick={() => onSelect(item.code)}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

function DashboardActionCard({
  detail,
  href,
  label,
  title,
}: Readonly<{
  detail: string;
  href: string;
  label: string;
  title: string;
}>) {
  return (
    <Link
      href={href}
      className="tc-student-card flex min-h-[132px] flex-col justify-between rounded-[20px] p-4 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div>
        <p className="tc-overline">{label}</p>
        <h2 className="mt-2 text-lg font-semibold leading-6 text-[color:var(--brand)]">
          {title}
        </h2>
      </div>
      <p className="tc-muted mt-4 text-sm leading-5">{detail}</p>
    </Link>
  );
}

function StatPill({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[16px] bg-white px-4 py-3">
      <p className="tc-overline">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[color:var(--brand)]">
        {value}
      </p>
    </div>
  );
}

function SubjectTopicCapsules({
  subject,
}: Readonly<{
  subject: StudentSubject;
}>) {
  const topics = flattenTopicTree(subject.topics);
  const visibleTopics = topics.slice(0, 3);
  const remainingCount = Math.max(0, topics.length - visibleTopics.length);

  if (topics.length === 0) {
    return <p className="tc-muted mt-1 text-xs">0 topics</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {visibleTopics.map((topic) => (
        <span key={topic.id} className="tc-student-chip" data-tone="soft">
          {topic.name}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="tc-muted text-xs font-semibold">
          ... and {remainingCount} more
        </span>
      ) : null}
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
    if (!snapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== snapshot.selectedMedium.code) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title="Dashboard could not load."
        description="Try again in a moment."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  if (dashboardQuery.isLoading || !dashboardData || !snapshot) {
    return (
      <LoadingState
        title="Loading dashboard"
        description="Preparing your content overview."
      />
    );
  }

  const selectedTrackCode = snapshot.selectedTrack?.code ?? null;
  const catalogHref = buildCatalogHref(selectedTrackCode);
  const visibleSubjects = snapshot.subjects;
  const lastSubject =
    lastCatalogSubjectSlug
      ? dashboardData.catalog.subjects.find(
          (subject) => subject.slug === lastCatalogSubjectSlug,
        ) ?? null
      : null;
  const latestAnnouncement = dashboardData.cms.announcements[0] ?? null;
  const latestAnnouncementHref = getPlainText(latestAnnouncement?.linkHref);
  const latestAnnouncementLabel = getPlainText(latestAnnouncement?.linkLabel);

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tc-overline">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
              Content overview
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="tc-student-chip">
              {getTrackLabel(snapshot.selectedTrack)}
            </span>
            <span className="tc-student-chip" data-tone="accent">
              {dashboardData.analytics.activeEntitlements > 0
                ? "Premium"
                : "Trial"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <TrackPicker
            activeCode={snapshot.selectedTrack?.code ?? null}
            items={dashboardData.catalog.examTracks.map((examTrack) => ({
              code: examTrack.code,
              name: getTrackLabel(examTrack),
            }))}
            onSelect={setActiveExamTrackCode}
          />
        </div>
      </section>

      {lastSubject ? (
        <Link
          href={buildSubjectNotesHref(lastSubject, {
            examTrackCode: selectedTrackCode,
            mediumCode: snapshot.selectedMedium?.code ?? null,
          })}
          className="tc-student-card flex items-center justify-between gap-4 rounded-[20px] p-4"
        >
          <div>
            <p className="tc-overline">Continue</p>
            <h2 className="mt-1 text-lg font-semibold text-[color:var(--brand)]">
              {lastSubject.name}
            </h2>
          </div>
          <span className="tc-button-secondary shrink-0">Open</span>
        </Link>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardActionCard
          detail="Listening and speaking drills"
          href="/student/english-speaking"
          label="English"
          title="Speaking practice"
        />
        <DashboardActionCard
          detail="Latest study material by subject and topic"
          href="/student/notes"
          label="Notes"
          title="Notes library"
        />
        <DashboardActionCard
          detail="Plans and payment access"
          href="/student/plans"
          label="Access"
          title="Plans"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="tc-student-panel rounded-[24px] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-overline">Subjects</p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--brand)]">
                Start studying
              </h2>
            </div>
            <Link href={catalogHref} className="tc-button-secondary">
              Catalog
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {visibleSubjects.length > 0 ? (
              visibleSubjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={buildSubjectNotesHref(subject, {
                    examTrackCode: selectedTrackCode,
                    mediumCode: snapshot.selectedMedium?.code ?? null,
                  })}
                  className="tc-student-card flex items-center justify-between gap-3 rounded-[18px] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-[color:var(--brand)]">
                      {subject.name}
                    </p>
                    <SubjectTopicCapsules subject={subject} />
                  </div>
                  <span className="tc-button-secondary shrink-0">Open</span>
                </Link>
              ))
            ) : (
              <div className="tc-student-card rounded-[18px] px-4 py-3">
                <p className="font-semibold text-[color:var(--brand)]">
                  No subjects published.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <StatPill
              label="Access"
              value={dashboardData.analytics.activeEntitlements > 0 ? "Active" : "Trial"}
            />
            <StatPill
              label="Plan till"
              value={formatSubscriptionDate(
                dashboardData.analytics.currentSubscription.endsAt,
              )}
            />
            <StatPill
              label="Unread"
              value={String(dashboardData.notifications.unreadCount)}
            />
          </div>
          <div className="grid gap-3">
            <DashboardActionCard
              detail={`${dashboardData.cms.announcements.length} academy updates`}
              href="/student/current-affairs"
              label="Updates"
              title="Current affairs"
            />
          </div>
        </div>
      </section>

      {latestAnnouncement ? (
        <section className="tc-student-card rounded-[20px] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="tc-overline">Latest update</p>
              <TextContent
                as="h2"
                className="mt-1 text-lg font-semibold text-[color:var(--brand)]"
                value={latestAnnouncement.title}
              />
            </div>
            {latestAnnouncementHref && latestAnnouncementLabel ? (
              <Link
                href={latestAnnouncementHref}
                className="tc-button-secondary"
              >
                {latestAnnouncementLabel}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
