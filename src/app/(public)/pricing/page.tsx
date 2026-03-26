import { PublicPageHero } from "@/components/public/public-page-hero";
import {
  PublicPlanCard,
  mapPlanPreviewToCardData,
  mapPlanToCardData,
} from "@/components/public/public-plan-card";
import { buildPublicMetadata, getPublicHomeContent } from "@/lib/public";

export async function generateMetadata() {
  return buildPublicMetadata({
    title: "Pricing",
    description:
      "View the public pricing foundation for Topper's Choice, designed for backend-managed plans and future checkout flows.",
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const content = await getPublicHomeContent();
  const cards =
    content.plans.length > 0
      ? content.plans.map(mapPlanToCardData)
      : content.planPreviews.map(mapPlanPreviewToCardData);

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHero
        eyebrow="Pricing route"
        title="Public pricing is structured for backend-managed plans."
        description="This page is server-first, linked into the public shell, and ready to render active plans from `/public/plans` whenever they are available."
        actions={[
          { label: "Contact support", href: "/contact", tone: "primary" },
          { label: "Browse preparation tracks", href: "/tracks/mpsc-allied", tone: "secondary" },
        ]}
        stats={[
          {
            label: content.hasLivePlans ? "Plan source" : "Plan source",
            value: content.hasLivePlans ? "Live backend" : "Preview fallback",
          },
          {
            label: "Checkout readiness",
            value: "Future-safe",
          },
          {
            label: "Route strategy",
            value: "Server-first",
          },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <PublicPlanCard key={`${card.title}-${card.priceLabel}`} card={card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="tc-panel rounded-[30px] p-6">
          <p className="tc-overline">Dynamic later, structured now</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            What becomes live when backend plan data is present
          </h2>
          <ul className="tc-muted mt-5 list-disc space-y-3 pl-5 text-sm leading-6">
            <li>Plan ordering, duration, and copy come from the public plans API.</li>
            <li>Entitlement hints can be surfaced without hardcoding premium rules into the landing page.</li>
            <li>Later checkout prompts can reuse the same pricing cards instead of redesigning this route.</li>
          </ul>
        </article>

        <article className="tc-card rounded-[30px] p-6">
          <p className="tc-overline">Current F03 boundary</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Checkout is intentionally held back.
          </h2>
          <p className="tc-muted mt-4 text-sm leading-7">
            This prompt establishes the public pricing surface only. Auth-aware
            purchase flows and entitlement checks will layer on in later frontend
            payment prompts after the student app and auth work arrive.
          </p>
        </article>
      </section>
    </div>
  );
}
