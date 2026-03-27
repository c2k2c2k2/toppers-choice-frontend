import Link from "next/link";
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
    <article className="tc-card tc-motion-rise rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {card.badge ? <p className="tc-overline">{card.badge}</p> : null}
          <h3 className="tc-display mt-2 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            {card.title}
          </h3>
        </div>
        <span className="tc-code-chip">{card.durationLabel}</span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
        {card.priceLabel}
      </p>
      <p className="tc-muted mt-3 text-sm leading-6">{card.description}</p>

      <ul className="tc-muted mt-5 space-y-2 text-sm leading-6">
        {card.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="tc-dot mt-2 text-[color:var(--accent-public)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={card.ctaHref} className="tc-button-primary mt-6">
        {card.ctaLabel}
      </Link>
    </article>
  );
}
