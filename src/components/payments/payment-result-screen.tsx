"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  buildPaymentResultHref,
  buildStudentPlansHref,
  formatPlanPrice,
  getPaymentOrderStatus,
  getPaymentStatusLabel,
  getPremiumIntentLabel,
  isTerminalPaymentStatus,
  parsePremiumIntent,
  type PaymentOrderStatus,
} from "@/lib/payments";
import {
  buildLoginRedirectHref,
  sanitizeRedirectTarget,
} from "@/lib/auth/session-utils";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { usePaymentCheckoutStore } from "@/stores";

function buildCurrentRoute(
  pathname: string,
  searchParams: {
    toString: () => string;
  },
) {
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function PaymentResultScreen() {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activeOrderId = usePaymentCheckoutStore((state) => state.activeOrderId);
  const activePlanId = usePaymentCheckoutStore((state) => state.activePlanId);
  const checkoutIntent = usePaymentCheckoutStore((state) => state.intent);
  const checkoutMerchantOrderCode = usePaymentCheckoutStore(
    (state) => state.merchantOrderCode,
  );
  const checkoutReturnTo = usePaymentCheckoutStore((state) => state.returnTo);
  const checkoutSource = usePaymentCheckoutStore((state) => state.source);
  const clearCheckout = usePaymentCheckoutStore((state) => state.clearCheckout);
  const syncCheckoutStatus = usePaymentCheckoutStore(
    (state) => state.syncCheckoutStatus,
  );
  const previousStatusRef = useRef<PaymentOrderStatus | null>(null);

  const orderId = searchParams.get("orderId") ?? activeOrderId;
  const merchantOrderCode =
    searchParams.get("merchantOrderCode") ?? checkoutMerchantOrderCode;
  const planId = searchParams.get("plan") ?? activePlanId;
  const intent = parsePremiumIntent(searchParams.get("intent") ?? checkoutIntent);
  const source = searchParams.get("source") ?? checkoutSource ?? "payment-result";
  const returnTo = sanitizeRedirectTarget(
    searchParams.get("returnTo") ?? checkoutReturnTo,
    "/student/plans",
  );
  const plansHref = buildStudentPlansHref({
    intent,
    planId,
    returnTo,
    source,
  });
  const canonicalResultHref = orderId
    ? buildPaymentResultHref({
        orderId,
        merchantOrderCode,
        planId,
        intent,
        returnTo,
        source,
      })
    : plansHref;
  const loginHref = buildLoginRedirectHref(
    "/student/login",
    orderId ? canonicalResultHref : buildCurrentRoute(pathname, searchParams),
  );

  const orderQuery = useAuthenticatedQuery({
    enabled: Boolean(orderId),
    queryFn: (accessToken) => getPaymentOrderStatus(orderId ?? "", accessToken),
    queryKey: orderId
      ? queryKeys.student.paymentOrder(orderId)
      : ["student", "payments", "order", "missing"],
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && isTerminalPaymentStatus(data.status) ? false : 4_000;
    },
  });

  useEffect(() => {
    if (!orderQuery.data) {
      return;
    }

    const nextStatus = orderQuery.data.status;

    if (previousStatusRef.current === nextStatus) {
      return;
    }

    previousStatusRef.current = nextStatus;
    syncCheckoutStatus({
      merchantOrderCode: orderQuery.data.merchantOrderCode,
      status: nextStatus,
    });

    if (nextStatus === "SUCCEEDED") {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.student.entitlements(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["student"],
      });
    }
  }, [orderQuery.data, queryClient, syncCheckoutStatus]);

  if (!orderId) {
    return (
      <EmptyState
        eyebrow="Payment result"
        title="There is no payment order to resume."
        description="Open the student plans route to start or resume a checkout flow."
        ctaHref="/student/plans"
        ctaLabel="Open student plans"
      />
    );
  }

  if (
    !authSession.isReady ||
    authSession.status === "hydrating" ||
    authSession.status === "session-restored"
  ) {
    return (
      <LoadingState
        title="Checking payment status"
        description="Preparing the student session so the order status can be read safely from the protected backend."
      />
    );
  }

  if (!authSession.isAuthenticated || authSession.user?.userType !== "STUDENT") {
    return (
      <section className="tc-card rounded-[32px] p-6 md:p-7">
        <p className="tc-kicker" style={{ color: "var(--accent-public)" }}>
          Payment result
        </p>
        <h1 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
          Sign in as the student account to finish this payment check.
        </h1>
        <p className="tc-muted mt-4 text-base leading-7">
          The provider return route is public, but the final order status and
          entitlement refresh are protected behind the student session.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={loginHref} className="tc-button-primary">
            Sign in as student
          </Link>
          <Link href={plansHref} className="tc-button-secondary">
            Open student plans
          </Link>
        </div>
      </section>
    );
  }

  if (orderQuery.isLoading || !orderQuery.data) {
    if (orderQuery.isError) {
      if (isApiError(orderQuery.error) && orderQuery.error.status === 404) {
        return (
          <EmptyState
            eyebrow="Payment result"
            title="That payment order was not found."
            description="The order id on this return link is not available for the current student account."
            ctaHref={plansHref}
            ctaLabel="Back to student plans"
          />
        );
      }

      return (
        <ErrorState
          title="The payment order could not be checked."
          description="We couldn't finish polling the protected payment status yet."
          onRetry={() => void orderQuery.refetch()}
        />
      );
    }

    return (
      <LoadingState
        title="Checking payment provider status"
        description="Polling the current order, refreshing terminal state, and reconciling any new entitlement grants."
      />
    );
  }

  const order = orderQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Payment result
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {order.status === "SUCCEEDED"
                ? "Payment confirmed and access refreshed."
                : order.status === "PENDING" || order.status === "CREATED"
                  ? "Payment is still being checked."
                  : "Payment did not complete."}
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              {order.status === "SUCCEEDED"
                ? `The ${getPremiumIntentLabel(intent)} purchase is marked successful. Entitlement-aware student routes will refresh from the backend state.`
                : order.status === "PENDING" || order.status === "CREATED"
                  ? "The payment provider has not reached a terminal result yet. This page keeps polling safely without trusting offline state."
                  : "The provider returned a non-success result. You can reopen the student plans route to retry or choose a different plan."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">{getPaymentStatusLabel(order.status)}</span>
              <span className="tc-stat-chip">{order.plan.name}</span>
              <span className="tc-stat-chip">{formatPlanPrice(order.plan)}</span>
              {merchantOrderCode ? (
                <span className="tc-stat-chip">{merchantOrderCode}</span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={
                  order.status === "SUCCEEDED"
                    ? returnTo
                    : buildStudentPlansHref({
                        intent,
                        planId: order.plan.id,
                        returnTo,
                        source,
                      })
                }
                className="tc-button-primary"
                onClick={() => {
                  if (isTerminalPaymentStatus(order.status)) {
                    clearCheckout();
                  }
                }}
              >
                {order.status === "SUCCEEDED"
                  ? "Return to student app"
                  : "Back to student plans"}
              </Link>
              <Link href={canonicalResultHref} className="tc-button-secondary">
                Refresh this status
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Plan</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {order.plan.name}
              </p>
              <p className="mt-2 text-sm text-white/72">
                {formatPlanPrice(order.plan)} for {order.plan.durationDays} days
              </p>
            </div>
            <div className="tc-glass rounded-[24px] p-5">
              <p className="tc-overline">Provider state</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {order.providerStatus ?? order.status}
              </p>
              <p className="mt-2 text-sm text-white/72">
                Order id: {order.id}
              </p>
            </div>
          </div>
        </div>
      </section>

      {order.status === "SUCCEEDED" ? (
        <section className="tc-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Next
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Premium routes can refresh from the updated entitlement state now.
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              "Student plans and protected routes invalidate their entitlement-backed queries after success.",
              "Secure note sessions and content routes still stay protected server-side after the refresh.",
              "No premium files or purchase state are trusted from offline cache alone.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] bg-[rgba(0,30,64,0.05)] px-4 py-3 text-sm leading-6 text-[color:var(--brand)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
