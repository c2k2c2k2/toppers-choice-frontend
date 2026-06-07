"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  filterContentByContext,
  getStudentContent,
  getStudentContentDetail,
  type ContentSummary,
} from "@/lib/content";
import {
  buildStudentCatalogSnapshot,
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { useStudentShellStore } from "@/stores";
import { AuthenticatedPdfReader } from "@/components/primitives/authenticated-pdf-reader";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

function getSelectionRank(
  content: ContentSummary,
  context: {
    examTrackId?: string | null;
    mediumId?: string | null;
  },
) {
  const trackRank = context.examTrackId
    ? content.examTracks.some((track) => track.id === context.examTrackId)
      ? 0
      : 1
    : 1;
  const mediumRank = context.mediumId
    ? content.mediums.some((medium) => medium.id === context.mediumId)
      ? 0
      : 1
    : 1;

  return trackRank + mediumRank;
}

function pickCareerGuidanceEntry(
  items: ContentSummary[],
  context: {
    examTrackId?: string | null;
    mediumId?: string | null;
  },
) {
  return (
    filterContentByContext(items, context)
      .filter((item) => item.access.canView)
      .sort((left, right) => {
        const rankDifference =
          getSelectionRank(left, context) - getSelectionRank(right, context);

        if (rankDifference !== 0) {
          return rankDifference;
        }

        return left.orderIndex - right.orderIndex;
      })[0] ?? null
  );
}

function getDisplayText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function StudentCareerGuidancePdfScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTrack = searchParams.get("track");
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();

  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const contentQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      getStudentContent(accessToken, {
        family: "CAREER_GUIDANCE",
      }),
    queryKey: queryKeys.student.contentList({
      family: "CAREER_GUIDANCE",
      search: null,
    }),
    staleTime: 30_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: requestedTrack ?? activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;
  const selectedEntry =
    snapshot && contentQuery.data
      ? pickCareerGuidanceEntry(contentQuery.data.items, {
          examTrackId: snapshot.selectedTrack?.id ?? null,
          mediumId: snapshot.selectedMedium?.id ?? null,
        })
      : null;

  const detailQuery = useAuthenticatedQuery({
    enabled: Boolean(selectedEntry?.slug),
    queryFn: (accessToken) =>
      getStudentContentDetail(selectedEntry?.slug ?? "", accessToken),
    queryKey: queryKeys.student.contentDetail(selectedEntry?.slug ?? "career-guidance"),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!snapshot?.selectedTrack?.code) {
      return;
    }

    if (!activeExamTrackCode || activeExamTrackCode !== snapshot.selectedTrack.code) {
      setActiveExamTrackCode(snapshot.selectedTrack.code);
    }
  }, [activeExamTrackCode, setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (!snapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== snapshot.selectedMedium.code) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  if (catalogQuery.isError || contentQuery.isError || detailQuery.isError) {
    return (
      <ErrorState
        title="Career guidance PDF could not load."
        description="We couldn't finish loading the guidance PDF for the selected track and medium."
        onRetry={() => {
          void catalogQuery.refetch();
          void contentQuery.refetch();
          void detailQuery.refetch();
        }}
      />
    );
  }

  if (catalogQuery.isLoading || contentQuery.isLoading || !catalog || !snapshot) {
    return (
      <LoadingState
        title="Preparing career guidance"
        description="Loading the selected track, medium, and matching PDF."
      />
    );
  }

  if (!selectedEntry) {
    return (
      <EmptyState
        eyebrow="Career guidance"
        title="No career guidance PDF is available for this medium yet."
        description={`Selected context: ${getTrackLabel(snapshot.selectedTrack)} · ${getMediumLabel(snapshot.selectedMedium)}`}
      />
    );
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <LoadingState
        title="Opening career guidance PDF"
        description="Loading the linked PDF attachment."
      />
    );
  }

  const pdfAttachment =
    detailQuery.data.attachments.find(
      (attachment) => attachment.fileAsset.contentType === "application/pdf",
    ) ?? detailQuery.data.attachments[0] ?? null;

  if (!pdfAttachment) {
    return (
      <EmptyState
        eyebrow="Career guidance"
        title="This guidance record does not have a PDF attached."
        description="Upload and attach the English or Marathi PDF from the admin structured-content editor."
      />
    );
  }

  const pdfTitle =
    getDisplayText(pdfAttachment.label) ??
    getDisplayText(detailQuery.data.title) ??
    "Career guidance PDF";

  return (
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[20px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="tc-overline">Career guidance</p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--brand)]">
              {pdfTitle}
            </h1>
            <p className="tc-muted mt-2 text-sm leading-6">
              {getTrackLabel(snapshot.selectedTrack)} - {getMediumLabel(snapshot.selectedMedium)}
            </p>
          </div>
          <span className="tc-student-chip" data-tone="soft">
            PDF
          </span>
        </div>
      </section>

      <AuthenticatedPdfReader
        asset={pdfAttachment.fileAsset}
        onClose={() => router.push("/student/guidance")}
        title={pdfTitle}
      />
    </div>
  );
}
