"use client";

import Link from "next/link";
import {
  formatPlanDuration,
  formatPlanPrice,
  getEntitlementKindLabel,
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
  const entitlementLabels = plan.entitlements
    .map((entitlement) => getEntitlementKindLabel(entitlement.entitlementKind))
    .slice(0, 3);

  return (
    <article
      className="tc-student-card flex h-full flex-col rounded-[22px] p-4 sm:p-5"
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
        <div className="min-w-0">
          <p className="tc-overline">
            {isRecommended
              ? `Best for ${getPremiumIntentLabel(intent)}`
              : "Plan"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            {plan.name}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {isCovered ? <span className="tc-student-chip" data-tone="accent">Active</span> : null}
          {isPendingOrder ? <span className="tc-student-chip" data-tone="soft">Pending</span> : null}
          {isSelected ? <span className="tc-student-chip" data-tone="soft">Selected</span> : null}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
          {formatPlanPrice(plan)}
        </p>
        <span className="tc-student-chip" data-tone="soft">
          {formatPlanDuration(plan.durationDays)}
        </span>
      </div>
      {(plan.shortDescription ?? plan.description) ? (
        <p className="tc-muted mt-3 line-clamp-2 text-sm leading-6">
          {plan.shortDescription ?? plan.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {entitlementLabels.map((label) => (
          <span key={label} className="tc-student-chip" data-tone="soft">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {featureLabels.map((feature) => (
          <div
            key={feature}
            className="rounded-[16px] border border-[rgba(0,30,64,0.08)] bg-white/70 px-3 py-2 text-sm leading-5 text-[color:var(--brand)]"
          >
            {feature}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5">
        {isCovered ? (
          <button type="button" className="tc-button-secondary w-full justify-center" disabled>
            Active plan
          </button>
        ) : isPendingOrder && paymentStatusHref ? (
          <Link href={paymentStatusHref} className="tc-button-primary w-full justify-center">
            Resume payment
          </Link>
        ) : (
          <button
            type="button"
            className="tc-button-primary w-full justify-center"
            onClick={() => onCheckout(plan)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Buy now"}
          </button>
        )}
      </div>
    </article>
  );
}
