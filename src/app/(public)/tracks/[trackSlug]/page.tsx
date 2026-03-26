import { notFound } from "next/navigation";
import { PublicPageBody } from "@/components/public/public-page-body";
import { PublicPageHero } from "@/components/public/public-page-hero";
import {
  PublicPlanCard,
  mapPlanPreviewToCardData,
  mapPlanToCardData,
} from "@/components/public/public-plan-card";
import {
  PUBLIC_TRACK_DEFINITIONS,
  buildPublicMetadata,
  getPublicTrackPageContent,
} from "@/lib/public";

type PublicTrackPageProps = {
  params: Promise<{
    trackSlug: string;
  }>;
};

export function generateStaticParams() {
  return PUBLIC_TRACK_DEFINITIONS.map((track) => ({
    trackSlug: track.slug,
  }));
}

export async function generateMetadata({ params }: PublicTrackPageProps) {
  const { trackSlug } = await params;
  const content = await getPublicTrackPageContent(trackSlug);

  if (!content) {
    return buildPublicMetadata({
      title: "Track not found",
      description: "The requested preparation track was not found.",
      path: `/tracks/${trackSlug}`,
      noIndex: true,
    });
  }

  return buildPublicMetadata({
    title: content.track.title,
    description: content.track.summary,
    path: `/tracks/${trackSlug}`,
  });
}

export default async function PublicTrackPage({ params }: PublicTrackPageProps) {
  const { trackSlug } = await params;
  const content = await getPublicTrackPageContent(trackSlug);

  if (!content) {
    notFound();
  }

  const planCards =
    content.plans.length > 0
      ? content.plans.slice(0, 2).map(mapPlanToCardData)
      : content.planPreviews.slice(0, 2).map(mapPlanPreviewToCardData);

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHero
        eyebrow={content.track.eyebrow}
        title={content.track.title}
        description={content.track.summary}
        actions={content.track.ctas}
        stats={content.track.stats}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className="tc-card rounded-[30px] p-6">
          <p className="tc-overline">Audience</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Who this path serves
          </h2>
          <p className="tc-muted mt-4 text-sm leading-7">{content.track.audience}</p>
          <ul className="tc-muted mt-5 list-disc space-y-3 pl-5 text-sm leading-6">
            {content.track.modules.map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ul>
        </article>

        <article className="tc-panel rounded-[30px] p-6">
          <p className="tc-overline">Expected outcomes</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Why this public track route exists early
          </h2>
          <ul className="tc-muted mt-5 list-disc space-y-3 pl-5 text-sm leading-6">
            {content.track.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </article>
      </section>

      {content.cmsPage ? (
        <PublicPageBody
          bodyJson={content.cmsPage.bodyJson}
          fallbackSummary={
            content.cmsPage.summary ??
            "This track is ready for richer authored CMS content when available."
          }
        />
      ) : null}

      <section className="space-y-4">
        <div className="max-w-3xl space-y-3">
          <p className="tc-overline">Pricing link-up</p>
          <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
            Track pages can already lead into the pricing surface.
          </h2>
          <p className="tc-muted text-base leading-7">
            This keeps public discovery, preparation-path exploration, and plan
            comparison connected even before checkout and student entitlement
            flows are added.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {planCards.map((card) => (
            <PublicPlanCard key={`${card.title}-${card.priceLabel}`} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
