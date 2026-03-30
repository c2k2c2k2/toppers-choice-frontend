"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  buildPaymentResultHref,
  createCheckout,
  formatPlanPrice,
  getCurrentEntitlements,
  getPaymentErrorMessage,
  getPaymentOrderStatus,
  getPaymentStatusLabel,
  getPlanById,
  getPremiumIntentLabel,
  hasIntentAccess,
  isActiveEntitlement,
  isPlanCoveredByEntitlements,
  isTerminalPaymentStatus,
  listPublicPlans,
  parsePremiumIntent,
  planSupportsIntent,
  type PublicPlan,
} from "@/lib/payments";
import { sanitizeRedirectTarget } from "@/lib/auth/session-utils";
import { StudentPlanCard } from "@/components/payments/student-plan-card";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";
import { usePaymentCheckoutStore } from "@/stores";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Ongoing";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudentPlansScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutLockRef = useRef(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const activeOrderId = usePaymentCheckoutStore((state) => state.activeOrderId);
  const activePlanId = usePaymentCheckoutStore((state) => state.activePlanId);
  const activeIntent = usePaymentCheckoutStore((state) => state.intent);
  const activeMerchantOrderCode = usePaymentCheckoutStore(
    (state) => state.merchantOrderCode,
  );
  const activeReturnTo = usePaymentCheckoutStore((state) => state.returnTo);
  const activeSource = usePaymentCheckoutStore((state) => state.source);
  const startCheckoutTracking = usePaymentCheckoutStore(
    (state) => state.startCheckout,
  );
  const syncCheckoutStatus = usePaymentCheckoutStore(
    (state) => state.syncCheckoutStatus,
  );
  const clearCheckout = usePaymentCheckoutStore((state) => state.clearCheckout);

  const intent = parsePremiumIntent(searchParams.get("intent") ?? activeIntent);
  const selectedPlanId = searchParams.get("plan") ?? activePlanId;
  const source = searchParams.get("source") ?? activeSource ?? "student-plans";
  const returnTo = sanitizeRedirectTarget(
    searchParams.get("returnTo") ?? activeReturnTo,
    "/student",
  );

  const plansQuery = useQuery({
    queryFn: () => listPublicPlans(),
    queryKey: queryKeys.publicPlans(),
    staleTime: 60_000,
  });
  const entitlementsQuery = useAuthenticatedQuery({
    queryFn: getCurrentEntitlements,
    queryKey: queryKeys.student.entitlements(),
    staleTime: 15_000,
  });
  const orderStatusQuery = useAuthenticatedQuery({
    enabled: Boolean(activeOrderId),
    queryFn: (accessToken) =>
      getPaymentOrderStatus(activeOrderId ?? "", accessToken),
    queryKey: activeOrderId
      ? queryKeys.student.paymentOrder(activeOrderId)
      : ["student", "payments", "order", "none"],
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && isTerminalPaymentStatus(data.status) ? false : 4_000;
    },
  });

  useEffect(() => {
    if (!orderStatusQuery.data) {
      return;
    }

    syncCheckoutStatus({
      merchantOrderCode: orderStatusQuery.data.merchantOrderCode,
      status: orderStatusQuery.data.status,
    });

    if (orderStatusQuery.data.status === "SUCCEEDED") {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.entitlements(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["student"],
      });
    }
  }, [orderStatusQuery.data, queryClient, syncCheckoutStatus]);

  const checkoutMutation = useAuthenticatedMutation({
    mutationFn: (
      variables: {
        idempotencyKey: string;
        plan: PublicPlan;
      },
      accessToken,
    ) =>
      createCheckout(
        {
          planId: variables.plan.id,
        },
        accessToken,
        variables.idempotencyKey,
      ),
    onSuccess: (order, variables) => {
      setInlineMessage(null);
      startCheckoutTracking({
        orderId: order.id,
        planId: variables.plan.id,
        intent,
        merchantOrderCode: order.merchantOrderCode,
        returnTo,
        source,
        status: order.status,
      });

      const resultHref = buildPaymentResultHref({
        orderId: order.id,
        merchantOrderCode: order.merchantOrderCode,
        planId: variables.plan.id,
        intent,
        returnTo,
        source,
      });

      if (order.redirectUrl) {
        window.location.assign(order.redirectUrl);
        return;
      }

      router.push(resultHref);
    },
    onError: (error) => {
      setInlineMessage(getPaymentErrorMessage(error));
    },
  });

  if (plansQuery.isError || entitlementsQuery.isError) {
    return (
      <ErrorState
        title="Student plans could not load."
        description="We couldn't finish loading the public plans and current entitlement state together."
        onRetry={() => {
          void plansQuery.refetch();
          void entitlementsQuery.refetch();
        }}
      />
    );
  }

  if (
    plansQuery.isLoading ||
    entitlementsQuery.isLoading ||
    !plansQuery.data ||
    !entitlementsQuery.data
  ) {
    return (
      <LoadingState
        title="Preparing student plans"
        description="Loading live public plans, current entitlements, and any in-flight payment order."
      />
    );
  }

  const plans = plansQuery.data.items;
  const entitlements = entitlementsQuery.data.items;
  const activeEntitlements = entitlements.filter((entitlement) =>
    isActiveEntitlement(entitlement),
  );
  const selectedPlan = getPlanById(plans, selectedPlanId);
  const manualEntitlements = activeEntitlements.filter((entitlement) => !entitlement.plan);
  const pendingOrder = orderStatusQuery.data;
  const paymentStatusHref =
    activeOrderId && activePlanId
      ? buildPaymentResultHref({
          orderId: activeOrderId,
          merchantOrderCode:
            pendingOrder?.merchantOrderCode ?? activeMerchantOrderCode,
          planId: activePlanId,
          intent,
          returnTo,
          source,
        })
      : null;

  async function handleCheckout(plan: PublicPlan) {
    if (checkoutLockRef.current) {
      return;
    }

    checkoutLockRef.current = true;
    setInlineMessage(null);
    setSubmittingPlanId(plan.id);

    try {
      await checkoutMutation.mutateAsync({
        idempotencyKey:
          globalThis.crypto?.randomUUID?.() ??
          `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        plan,
      });
    } finally {
      checkoutLockRef.current = false;
      setSubmittingPlanId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Student plans
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Plans, entitlements, and checkout live in the student shell now.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              This route keeps pricing backend-driven, uses authenticated
              entitlement checks, and preserves a safe return path back into the
              student flow after checkout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">
                Looking for {getPremiumIntentLabel(intent)}
              </span>
              <span className="tc-stat-chip">
                {activeEntitlements.length > 0
                  ? `${activeEntitlements.length} active entitlement${activeEntitlements.length === 1 ? "" : "s"}`
                  : "No active entitlements yet"}
              </span>
              <span className="tc-stat-chip">Return to {returnTo}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => {
                  void entitlementsQuery.refetch();
                  void plansQuery.refetch();
                  if (activeOrderId) {
                    void orderStatusQuery.refetch();
                  }
                }}
              >
                Refresh access
              </button>
              <Link href={returnTo} className="tc-button-secondary">
                Back to student app
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Current access</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {hasIntentAccess(activeEntitlements, intent)
                  ? `Already unlocked for ${getPremiumIntentLabel(intent)}`
                  : `Upgrade needed for ${getPremiumIntentLabel(intent)}`}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Active access respects backend starts, expiry, and revoke timestamps.
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Selected plan</p>
              <TextContent
                as="p"
                className="mt-4 text-lg font-semibold text-white"
                value={selectedPlan?.name ?? "Choose a live plan"}
              />
              <p className="mt-2 text-sm text-white/72">
                {selectedPlan ? formatPlanPrice(selectedPlan) : "Plans remain backend-managed."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {inlineMessage ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          {inlineMessage}
        </div>
      ) : null}

      {pendingOrder ? (
        <section className="tc-student-panel rounded-[28px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                Payment tracker
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                <TextContent as="span" value={pendingOrder.plan.name} />{" "}
                is {getPaymentStatusLabel(pendingOrder.status).toLowerCase()}.
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                Order {pendingOrder.merchantOrderCode} stays attached to this
                session until it reaches a terminal state or you dismiss it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {paymentStatusHref ? (
                <Link href={paymentStatusHref} className="tc-button-primary">
                  Open payment status
                </Link>
              ) : null}
              {isTerminalPaymentStatus(pendingOrder.status) ? (
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={clearCheckout}
                >
                  Dismiss tracker
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {manualEntitlements.length > 0 ? (
        <section className="tc-student-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Access already granted
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Manual or support-issued entitlements are active on this account.
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {manualEntitlements.map((entitlement) => (
              <div key={entitlement.id} className="tc-student-card rounded-[24px] p-5">
                <p className="tc-overline">{entitlement.kind}</p>
                <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                  {entitlement.sourceType.replace(/_/g, " ")}
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Starts {formatTimestamp(entitlement.startsAt)} · Ends{" "}
                  {formatTimestamp(entitlement.endsAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {plans.length === 0 ? (
        <EmptyState
          eyebrow="Student plans"
          title="No active public plans are published yet."
          description="The student checkout flow is live, but the backend has not published any `ACTIVE` public plans yet. Entitlement refresh and payment status handling are still ready once plans are seeded."
          ctaHref="/pricing"
          ctaLabel="Open public pricing"
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <StudentPlanCard
              key={plan.id}
              intent={intent}
              isCovered={isPlanCoveredByEntitlements(plan, activeEntitlements)}
              isPendingOrder={activePlanId === plan.id && Boolean(activeOrderId)}
              isRecommended={planSupportsIntent(plan, intent)}
              isSelected={selectedPlanId === plan.id}
              onCheckout={handleCheckout}
              paymentStatusHref={paymentStatusHref}
              plan={plan}
              submittingPlanId={submittingPlanId}
            />
          ))}
        </section>
      )}

      {plansQuery.data.items.length > 0 && !selectedPlan ? (
        <section className="tc-student-card rounded-[28px] p-6">
          <p className="tc-overline">Plan selection</p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            Plan choice can be preselected from public pricing or any locked student route.
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            The student shell keeps the checkout intent and safe return route in
            the query string so notes, content, practice, and tests can all
            reuse this one plans surface.
          </p>
        </section>
      ) : null}
    </div>
  );
}
