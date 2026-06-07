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
  formatPlanDuration,
  getCurrentEntitlements,
  getEntitlementKindLabel,
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
        title="Plans could not load."
        description="Please try again."
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
        title="Preparing plans"
        description="Loading your access and available plans."
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
  const hasRequestedAccess = hasIntentAccess(activeEntitlements, intent);
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
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[22px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
              Premium access
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-[color:var(--brand)] md:text-3xl">
              {hasRequestedAccess
                ? "Your premium access is active"
                : "Choose a plan to continue"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="tc-student-chip" data-tone={hasRequestedAccess ? "accent" : "soft"}>
                {hasRequestedAccess
                  ? "Access active"
                  : `${getPremiumIntentLabel(intent)} needed`}
              </span>
              {activeEntitlements.length > 0 ? (
                <span className="tc-student-chip" data-tone="soft">
                  {activeEntitlements.length} active
                </span>
              ) : null}
              {selectedPlan ? (
                <span className="tc-student-chip" data-tone="soft">
                  {selectedPlan.name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              className="tc-button-primary justify-center"
              onClick={() => {
                void entitlementsQuery.refetch();
                void plansQuery.refetch();
                if (activeOrderId) {
                  void orderStatusQuery.refetch();
                }
              }}
            >
              Refresh
            </button>
            <Link href={returnTo} className="tc-button-secondary justify-center">
              Back
            </Link>
          </div>
        </div>
      </section>

      {inlineMessage ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          {inlineMessage}
        </div>
      ) : null}

      {pendingOrder ? (
        <section className="tc-student-panel rounded-[22px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
                Payment
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--brand)]">
                <TextContent as="span" value={pendingOrder.plan.name} />{" "}
                is {getPaymentStatusLabel(pendingOrder.status).toLowerCase()}.
              </h2>
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
        <section className="tc-student-panel rounded-[22px] p-4 sm:p-5">
          <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
            Extra access
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {manualEntitlements.map((entitlement) => (
              <div key={entitlement.id} className="tc-student-card rounded-[18px] p-4">
                <p className="text-sm font-semibold text-[color:var(--brand)]">
                  {getEntitlementKindLabel(entitlement.kind)}
                </p>
                <p className="tc-muted mt-1 text-sm leading-6">
                  Valid till{" "}
                  {formatTimestamp(entitlement.endsAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {plans.length === 0 ? (
        <EmptyState
          eyebrow="Plans"
          title="No active public plans are published yet."
          description="Please check again later."
          ctaHref="/pricing"
          ctaLabel="Open public pricing"
        />
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
                Available plans
              </p>
              {selectedPlan ? (
                <p className="tc-muted mt-1 text-sm">
                  Selected: {selectedPlan.name} · {formatPlanPrice(selectedPlan)} ·{" "}
                  {formatPlanDuration(selectedPlan.durationDays)}
                </p>
              ) : null}
            </div>
            <span className="tc-student-chip" data-tone="soft">
              {plans.length} option{plans.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            {plans.map((plan) => (
              <StudentPlanCard
                key={plan.id}
                intent={intent}
                isCovered={isPlanCoveredByEntitlements(plan, activeEntitlements)}
                isPendingOrder={
                  activePlanId === plan.id &&
                  Boolean(activeOrderId) &&
                  !isTerminalPaymentStatus(pendingOrder?.status ?? "CREATED")
                }
                isRecommended={planSupportsIntent(plan, intent)}
                isSelected={selectedPlanId === plan.id}
                onCheckout={handleCheckout}
                paymentStatusHref={paymentStatusHref}
                plan={plan}
                submittingPlanId={submittingPlanId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
