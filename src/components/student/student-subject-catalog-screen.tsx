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
        mediumCode: activeMediumCode,
      })
    : null;
  const subject =
    catalog && snapshot
      ? findSubjectBySlug(catalog, subjectSlug, {
          examTrackId: snapshot.selectedTrack?.id ?? null,
        })
      : null;

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
        description="Please try again."
        onRetry={() => void catalogQuery.refetch()}
      />
    );
  }

  if (catalogQuery.isLoading || !catalog || !snapshot) {
    return (
      <LoadingState
        title="Preparing the subject map"
        description="Loading topics."
      />
    );
  }

  if (!subject) {
    return (
      <EmptyState
        eyebrow="Subject not found"
        title="That subject is not available."
        description="Open the catalog and choose another subject."
        ctaHref="/student/catalog"
        ctaLabel="Back to catalog"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-overline">Subject</p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--brand)]">
              {subject.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tc-student-chip" data-tone="soft">
              {countTopics(subject.topics)} topics
            </span>
            <Link href="/student/catalog" className="tc-button-secondary">
              Back
            </Link>
          </div>
        </div>
      </section>

      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tc-overline">Topics</p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--brand)]">
                Choose a topic
              </h2>
            </div>
          </div>
          <div className="mt-4">
            <StudentTopicTree topics={subject.topics} />
          </div>
      </section>
    </div>
  );
}
