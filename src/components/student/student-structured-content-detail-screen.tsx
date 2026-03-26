"use client";

import Link from "next/link";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  ContentAttachmentDownloadCard,
} from "@/components/content/content-attachment-download-card";
import { StructuredContentRenderer } from "@/components/content/structured-content-renderer";
import {
  formatContentDate,
  formatReadingTime,
  getContentAccessDescriptor,
  getContentExcerpt,
  getContentFamilyDefinition,
  getContentMetaChips,
  getContentMetaText,
  getContentMediumLabels,
  getContentTrackLabels,
  getStudentContentDetail,
  isContentDetailViewable,
  resolveStructuredContentFontHint,
  type ContentFamily,
} from "@/lib/content";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

export function StudentStructuredContentDetailScreen({
  family,
  slug,
}: Readonly<{
  family: ContentFamily;
  slug: string;
}>) {
  const familyDefinition = getContentFamilyDefinition(family);
  const contentQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getStudentContentDetail(slug, accessToken),
    queryKey: queryKeys.student.contentDetail(slug),
    staleTime: 30_000,
  });

  if (contentQuery.isLoading || !contentQuery.data) {
    if (
      contentQuery.isError &&
      isApiError(contentQuery.error) &&
      contentQuery.error.status === 404
    ) {
      return (
        <EmptyState
          eyebrow={familyDefinition.eyebrow}
          title="That lesson is not in the published library."
          description="The route is live, but the requested content slug does not exist in the current published backend response."
          ctaHref={familyDefinition.collectionHref}
          ctaLabel={`Back to ${familyDefinition.label}`}
        />
      );
    }

    if (contentQuery.isError) {
      return (
        <ErrorState
          title={`${familyDefinition.label} could not load.`}
          description="We couldn't finish loading the selected structured content detail from the protected backend."
          onRetry={() => void contentQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title={`Preparing ${familyDefinition.label.toLowerCase()}`}
        description="Loading the content detail, entitlement state, and structured lesson body."
      />
    );
  }

  const content = contentQuery.data;

  if (content.family !== family) {
    const actualFamilyDefinition = getContentFamilyDefinition(content.family);

    return (
      <EmptyState
        eyebrow="Route mismatch"
        title="This slug belongs to another content family."
        description={`The published item exists, but it belongs under ${actualFamilyDefinition.label} instead of ${familyDefinition.label}.`}
        ctaHref={actualFamilyDefinition.detailHref(content.slug)}
        ctaLabel={`Open ${actualFamilyDefinition.label}`}
      />
    );
  }

  const accessDescriptor = getContentAccessDescriptor(content.access);
  const trackLabels = getContentTrackLabels(content);
  const mediumLabels = getContentMediumLabels(content);
  const metaChips = getContentMetaChips(content.metaJson);
  const fontHint = resolveStructuredContentFontHint(
    content.bodyJson,
    content.metaJson,
  );
  const canViewContent = isContentDetailViewable(content);
  const summaryMonth = getContentMetaText(content.metaJson, "month");
  const summaryLevel = getContentMetaText(content.metaJson, "lessonLevel");

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              {familyDefinition.eyebrow}
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {content.title}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {getContentExcerpt(content)}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">{accessDescriptor.badgeLabel}</span>
              <span className="tc-stat-chip">
                {formatReadingTime(content.readingTimeMinutes)}
              </span>
              <span className="tc-stat-chip">
                Published {formatContentDate(content.publishedAt)}
              </span>
              {metaChips.map((chip) => (
                <span key={chip} className="tc-stat-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Tracks</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {trackLabels.length > 0 ? trackLabels.join(", ") : "All tracks"}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Content visibility matches the current student study context.
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Mediums</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {mediumLabels.length > 0 ? mediumLabels.join(", ") : "All mediums"}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Mixed-language and Marathi rendering stay on the shared content surface.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="flex flex-col gap-6">
          <section className="tc-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="tc-kicker"
                  style={{ color: familyDefinition.accentCssVar }}
                >
                  Lesson summary
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  Access, context, and publishing cues
                </h2>
              </div>
              <Link href={familyDefinition.collectionHref} className="tc-button-secondary">
                Back to list
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="tc-card rounded-[24px] p-5">
                <p className="tc-overline">Access state</p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
                  {accessDescriptor.badgeLabel}
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  {accessDescriptor.description}
                </p>
                {accessDescriptor.ctaHref && accessDescriptor.ctaLabel ? (
                  <Link
                    href={accessDescriptor.ctaHref}
                    className="tc-button-primary mt-4"
                  >
                    {accessDescriptor.ctaLabel}
                  </Link>
                ) : null}
              </div>

              <div className="tc-card rounded-[24px] p-5">
                <p className="tc-overline">Publishing details</p>
                <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-[color:var(--brand)]">
                  <p>Published: {formatContentDate(content.publishedAt)}</p>
                  <p>Updated: {formatContentDate(content.updatedAt)}</p>
                  <p>Reading time: {formatReadingTime(content.readingTimeMinutes)}</p>
                </div>
              </div>

              {(summaryMonth || summaryLevel) && (
                <div className="tc-card rounded-[24px] p-5">
                  <p className="tc-overline">Lesson metadata</p>
                  <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-[color:var(--brand)]">
                    {summaryMonth ? <p>Month: {summaryMonth}</p> : null}
                    {summaryLevel ? <p>Lesson level: {summaryLevel}</p> : null}
                  </div>
                </div>
              )}
            </div>
          </section>

          {content.attachments.length > 0 ? (
            <section className="tc-panel rounded-[28px] p-6">
              <p
                className="tc-kicker"
                style={{ color: familyDefinition.accentCssVar }}
              >
                Attachments
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                Supporting files for this lesson
              </h2>

              <div className="mt-5 grid gap-4">
                {content.attachments.map((attachment) => (
                  <ContentAttachmentDownloadCard
                    key={attachment.id}
                    attachment={attachment}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {canViewContent ? (
          <section className="tc-card rounded-[28px] p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className="tc-kicker"
                  style={{ color: familyDefinition.accentCssVar }}
                >
                  Lesson body
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
                  Structured content renderer
                </h2>
              </div>
              <span className="tc-code-chip">{content.format}</span>
            </div>

            <div className="mt-6">
              <StructuredContentRenderer
                bodyJson={content.bodyJson}
                fallbackFontHint={fontHint}
              />
            </div>
          </section>
        ) : (
          <section className="tc-panel rounded-[28px] p-6 md:p-7">
            <p className="tc-kicker" style={{ color: "var(--accent-public)" }}>
              Locked lesson
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              This structured lesson is published, but the full body is protected.
            </h2>
            <p className="tc-muted mt-3 text-base leading-7">
              {accessDescriptor.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">{content.accessType}</span>
              <span className="tc-stat-chip">{content.format}</span>
              <span className="tc-stat-chip">{familyDefinition.label}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/pricing" className="tc-button-primary">
                See plans
              </Link>
              <Link href={familyDefinition.collectionHref} className="tc-button-secondary">
                Back to list
              </Link>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
