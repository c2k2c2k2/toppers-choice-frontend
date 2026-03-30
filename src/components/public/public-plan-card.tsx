import Link from "next/link";
import { TextContent } from "@/components/primitives/text-content";
import {
  buildStudentPlansHref,
  formatPlanDuration,
  formatPlanPrice,
  getPlanFeatureLabels,
  inferPlanIntent,
  type PublicPlan,
} from "@/lib/payments";
import type { PublicPlanPreview } from "@/lib/public";

export interface PublicPlanCardData {
  badge?: string;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  durationLabel: string;
  features: string[];
  priceLabel: string;
  title: string;
}

export function mapPlanToCardData(plan: PublicPlan): PublicPlanCardData {
  return {
    title: plan.name,
    description:
      plan.shortDescription ??
      plan.description ??
      "Choose this plan to continue in the student app.",
    priceLabel: formatPlanPrice(plan),
    durationLabel: `${formatPlanDuration(plan.durationDays)} access`,
    features: getPlanFeatureLabels(plan).slice(0, 4),
    ctaLabel: "Continue in student app",
    ctaHref: buildStudentPlansHref({
      intent: inferPlanIntent(plan),
      planId: plan.id,
      returnTo: "/pricing",
      source: "public-pricing",
    }),
  };
}

export function mapPlanPreviewToCardData(
  preview: PublicPlanPreview,
): PublicPlanCardData {
  return {
    badge: preview.badge,
    ctaHref: preview.ctaHref,
    ctaLabel: preview.ctaLabel,
    description: preview.summary,
    durationLabel: preview.durationLabel,
    features: preview.features,
    priceLabel: preview.priceLabel,
    title: preview.name,
  };
}

export function PublicPlanCard({
  card,
}: Readonly<{
  card: PublicPlanCardData;
}>) {
  return (
    <article className="tc-public-surface tc-motion-rise rounded-[30px] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          {card.badge ? (
            <span className="tc-public-badge" data-tone="accent">
              {card.badge}
            </span>
          ) : null}
          <TextContent
            as="h3"
            className="tc-display mt-2 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
            value={card.title}
          />
        </div>
        <span className="tc-public-badge" data-tone="soft">
          {card.durationLabel}
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
        {card.priceLabel}
      </p>
      <TextContent
        as="p"
        className="tc-muted mt-3 text-sm leading-6"
        preserveLineBreaks
        value={card.description}
      />

      <ul className="tc-muted mt-5 space-y-2 text-sm leading-6">
        {card.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="tc-dot mt-2 text-[color:var(--accent-public)]" />
            <TextContent as="span" value={feature} />
          </li>
        ))}
      </ul>

      <Link href={card.ctaHref} className="tc-button-primary mt-6">
        <TextContent as="span" value={card.ctaLabel} />
      </Link>
    </article>
  );
}
