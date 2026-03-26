"use client";

import Link from "next/link";
import {
  formatPlanDuration,
  formatPlanPrice,
  getPlanFeatureLabels,
  getPremiumIntentLabel,
  type PremiumIntent,
  type PublicPlan,
} from "@/lib/payments";

interface StudentPlanCardProps {
  intent: PremiumIntent;
  isCovered: boolean;
  isPendingOrder: boolean;
  isRecommended: boolean;
  isSelected: boolean;
  onCheckout: (plan: PublicPlan) => void;
  paymentStatusHref: string | null;
  plan: PublicPlan;
  submittingPlanId: string | null;
}

export function StudentPlanCard({
  intent,
  isCovered,
  isPendingOrder,
  isRecommended,
  isSelected,
  onCheckout,
  paymentStatusHref,
  plan,
  submittingPlanId,
}: Readonly<StudentPlanCardProps>) {
  const featureLabels = getPlanFeatureLabels(plan).slice(0, 5);
  const isSubmitting = submittingPlanId === plan.id;

  return (
    <article
      className="tc-card rounded-[30px] p-6"
      style={
        isSelected
          ? {
              border: "1px solid rgba(184, 130, 42, 0.36)",
              boxShadow: "0 24px 64px rgba(0, 30, 64, 0.14)",
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tc-overline">
            {isRecommended
              ? `Recommended for ${getPremiumIntentLabel(intent)}`
              : "Backend-managed plan"}
          </p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
            {plan.name}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {isCovered ? <span className="tc-code-chip">Already included</span> : null}
          {isPendingOrder ? <span className="tc-code-chip">Pending order</span> : null}
          {isSelected ? <span className="tc-code-chip">Selected</span> : null}
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
        {formatPlanPrice(plan)}
      </p>
      <p className="tc-muted mt-2 text-sm">{formatPlanDuration(plan.durationDays)} access</p>
      <p className="tc-muted mt-4 text-sm leading-6">
        {plan.shortDescription ??
          plan.description ??
          "Live pricing, duration, and entitlements are coming from the backend plan contract."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {plan.entitlements.map((entitlement) => (
          <span key={entitlement.id} className="tc-stat-chip">
            {entitlement.entitlementKind}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {featureLabels.map((feature) => (
          <div
            key={feature}
            className="rounded-[22px] bg-[rgba(0,30,64,0.05)] px-4 py-3 text-sm leading-6 text-[color:var(--brand)]"
          >
            {feature}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isCovered ? (
          <button type="button" className="tc-button-secondary" disabled>
            Included in current access
          </button>
        ) : isPendingOrder && paymentStatusHref ? (
          <Link href={paymentStatusHref} className="tc-button-primary">
            Resume payment status
          </Link>
        ) : (
          <button
            type="button"
            className="tc-button-primary"
            onClick={() => onCheckout(plan)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting checkout..." : "Continue to checkout"}
          </button>
        )}
      </div>
    </article>
  );
}
