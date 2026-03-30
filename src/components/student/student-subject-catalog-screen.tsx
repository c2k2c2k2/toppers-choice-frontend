"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  buildStudentCatalogSnapshot,
  countTopics,
  findSubjectBySlug,
  getStudentCatalog,
  getOptionalText,
  getTrackLabel,
} from "@/lib/student";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { StudentTopicTree } from "@/components/student/student-topic-tree";
import { useStudentShellStore } from "@/stores";

export function StudentSubjectCatalogScreen({
  subjectSlug,
}: Readonly<{
  subjectSlug: string;
}>) {
  const searchParams = useSearchParams();
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
    setLastCatalogSubjectSlug,
  } = useStudentShellStore();

  const catalogQuery = useAuthenticatedQuery({
    queryKey: queryKeys.student.catalog(),
    queryFn: getStudentCatalog,
    staleTime: 60_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: searchParams.get("track") ?? activeExamTrackCode,
        mediumCode: searchParams.get("medium") ?? activeMediumCode,
      })
    : null;
  const subject = catalog ? findSubjectBySlug(catalog, subjectSlug) : null;

  useEffect(() => {
    if (!snapshot?.selectedTrack?.code) {
      return;
    }

    setActiveExamTrackCode(snapshot.selectedTrack.code);
  }, [setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (!snapshot?.selectedMedium?.code) {
      return;
    }

    setActiveMediumCode(snapshot.selectedMedium.code);
  }, [setActiveMediumCode, snapshot?.selectedMedium?.code]);

  useEffect(() => {
    setLastCatalogSubjectSlug(subjectSlug);
  }, [setLastCatalogSubjectSlug, subjectSlug]);

  if (catalogQuery.isError) {
    return (
      <ErrorState
        title="This subject could not be loaded."
        description="The student subject route couldn't finish loading the catalog data from the backend."
        onRetry={() => void catalogQuery.refetch()}
      />
    );
  }

  if (catalogQuery.isLoading || !catalog || !snapshot) {
    return (
      <LoadingState
        title="Preparing the subject map"
        description="Loading the selected subject and its topic tree from the authenticated catalog."
      />
    );
  }

  if (!subject) {
    return (
      <EmptyState
        eyebrow="Subject not found"
        title="That subject isn't in the published catalog."
        description="The route is live, but the requested slug doesn't exist in the current authenticated catalog response."
        ctaHref="/student/catalog"
        ctaLabel="Back to catalog"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Subject route
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {subject.name}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {getOptionalText(subject.description) ??
                "The subject drill-down is ready for notes, structured content, practice, and tests to plug into the same topic tree later."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">
                {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                {snapshot.selectedMedium?.name ?? "All mediums"}
              </span>
              <span className="tc-stat-chip">{countTopics(subject.topics)} topics</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Subject code</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {subject.code}
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Top-level topics</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {subject.topics.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="tc-student-panel rounded-[28px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Topic map
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Navigate the current topic hierarchy
              </h2>
            </div>
            <Link href="/student/catalog" className="tc-button-secondary">
              Back to catalog
            </Link>
          </div>
          <div className="mt-6">
            <StudentTopicTree topics={subject.topics} />
          </div>
        </div>

        <div className="tc-student-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Next student modules
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            This subject context is ready to flow into later student features.
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {[
              "Notes discovery and secure reader",
              "Guidance and structured content modules",
              "Practice sets and weak-area flows",
              "Timed tests and result review",
            ].map((label) => (
              <div key={label} className="tc-student-card rounded-[24px] p-5">
                <p className="font-semibold text-[color:var(--brand)]">{label}</p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  The selected track, medium, subject, and topic map are already
                  centralized so later routes don&apos;t need to rebuild discovery.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
