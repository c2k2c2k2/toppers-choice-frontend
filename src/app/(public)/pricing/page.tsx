import Link from "next/link";
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
      "Compare Topper's Choice plans and continue to the student app when you are ready to enroll.",
    path: "/pricing",
  });
}

export default async function PricingPage() {
  const content = await getPublicHomeContent();
  const supportHref = `https://wa.me/91${content.branding.supportWhatsapp.replace(/\D/g, "")}`;
  const cards =
    content.plans.length > 0
      ? content.plans.map(mapPlanToCardData)
      : content.planPreviews.map(mapPlanPreviewToCardData);

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHero
        eyebrow="Plans"
        title="Choose the plan that fits your preparation."
        description="Compare the available Topper's Choice plans here. When you are ready, continue to the student app to sign in and complete enrollment."
        actions={[
          { label: "Open student plans", href: "/student/plans?intent=all&source=public-pricing&returnTo=%2Fpricing", tone: "primary" },
          { label: "Talk to support", href: supportHref, tone: "secondary" },
        ]}
        stats={[
          {
            label: "Plans",
            value: content.hasLivePlans ? `${content.plans.length} live` : "Ask for fees",
          },
          {
            label: "Access",
            value: "Notes, tests, guidance",
          },
          {
            label: "Enrollment",
            value: "Student login required",
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
          <p className="tc-overline">How enrollment works</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Compare first, enroll after sign-in.
          </h2>
          <ul className="tc-muted mt-5 list-disc space-y-3 pl-5 text-sm leading-6">
            <li>Compare the plan options here before you decide.</li>
            <li>Continue to the student app when you want to sign in or create an account.</li>
            <li>Complete payment and access refresh inside the student area tied to your account.</li>
          </ul>
        </article>

        <article className="tc-card rounded-[30px] p-6">
          <p className="tc-overline">Need help choosing?</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            Talk to the academy before you enroll.
          </h2>
          <p className="tc-muted mt-4 text-sm leading-7">
            If you want help choosing the right plan, batch, or access level,
            message support first and then continue with enrollment when you are
            ready.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={supportHref} className="tc-button-primary">
              WhatsApp support
            </Link>
            <Link href="/tracks/mpsc-allied" className="tc-button-secondary">
              Explore tracks
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
