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
      "View the public pricing foundation for Topper's Choice, with backend-managed plans that now bridge into the live student checkout flow.",
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
        title="Public pricing now hands off into the live student plans flow."
        description="This page stays server-first, renders backend-managed plans from `/public/plans`, and routes purchase intent into the authenticated student checkout surface."
        actions={[
          { label: "Open student plans", href: "/student/plans?intent=all&source=public-pricing&returnTo=%2Fpricing", tone: "primary" },
          { label: "Browse preparation tracks", href: "/tracks/mpsc-allied", tone: "secondary" },
        ]}
        stats={[
          {
            label: content.hasLivePlans ? "Plan source" : "Plan source",
            value: content.hasLivePlans ? "Live backend" : "Preview fallback",
          },
          {
            label: "Checkout readiness",
            value: "Student handoff live",
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
            <li>Plan cards can hand off intent into the protected student plans route without redesigning public pricing.</li>
            <li>Payment result polling and entitlement refresh stay in the shared frontend foundation after checkout returns.</li>
          </ul>
        </article>

        <article className="tc-card rounded-[30px] p-6">
          <p className="tc-overline">Current F09 shape</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Public discovery stays public. Checkout still becomes student-aware.
          </h2>
          <p className="tc-muted mt-4 text-sm leading-7">
            The public route does not create orders directly. It hands the user
            into the protected student shell so checkout, payment status, and
            entitlement refresh all stay tied to the authenticated account.
          </p>
        </article>
      </section>
    </div>
  );
}
