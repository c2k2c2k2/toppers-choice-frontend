import type { ApiRequestOptions } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type {
  CheckoutResponse,
  CreateCheckoutInput,
  Entitlement,
  EntitlementsListResponse,
  PaymentOrder,
  Plan,
  PublicPlan,
  PublicPlansListResponse,
  RawCheckoutResponse,
  RawEntitlementsListResponse,
  RawPaymentOrder,
  RawPublicPlan,
  RawPublicPlansListResponse,
  Subscription,
} from "@/lib/payments/types";

function asNullableRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizePlan(plan: RawPublicPlan): Plan {
  return {
    ...plan,
    shortDescription: asNullableString(plan.shortDescription),
    description: asNullableString(plan.description),
    metadataJson: asNullableRecord(plan.metadataJson),
    entitlements: plan.entitlements.map((entitlement) => ({
      ...entitlement,
      scopeJson: asNullableRecord(entitlement.scopeJson),
    })),
  };
}

function normalizeSubscription(
  subscription: RawPaymentOrder["subscription"],
): Subscription | null {
  if (!subscription) {
    return null;
  }

  return {
    ...subscription,
    cancelledAt: asNullableString(subscription.cancelledAt),
    metadataJson: asNullableRecord(subscription.metadataJson),
    plan: normalizePlan(subscription.plan),
    revokedAt: asNullableString(subscription.revokedAt),
    revokedReason: asNullableString(subscription.revokedReason),
  };
}

function normalizeEntitlement(entitlement: RawEntitlementsListResponse["items"][number]): Entitlement {
  return {
    ...entitlement,
    endsAt: asNullableString(entitlement.endsAt),
    grantedByUser: entitlement.grantedByUser ?? null,
    metadataJson: asNullableRecord(entitlement.metadataJson),
    paymentOrder: entitlement.paymentOrder ?? null,
    plan: entitlement.plan ? normalizePlan(entitlement.plan) : null,
    revokedAt: asNullableString(entitlement.revokedAt),
    revokedReason: asNullableString(entitlement.revokedReason),
    scopeJson: asNullableRecord(entitlement.scopeJson),
    subscription: normalizeSubscription(entitlement.subscription),
  };
}

function normalizePaymentOrder(order: RawPaymentOrder | RawCheckoutResponse): PaymentOrder {
  return {
    ...order,
    callbackConfirmedAt: asNullableString(order.callbackConfirmedAt),
    confirmedAt: asNullableString(order.confirmedAt),
    expiresAt: asNullableString(order.expiresAt),
    failedAt: asNullableString(order.failedAt),
    lastCheckedAt: asNullableString(order.lastCheckedAt),
    metadataJson: asNullableRecord(order.metadataJson),
    plan: normalizePlan(order.plan),
    providerOrderId: asNullableString(order.providerOrderId),
    providerReferenceId: asNullableString(order.providerReferenceId),
    providerStatus: asNullableString(order.providerStatus),
    redirectUrl: asNullableString(order.redirectUrl),
    subscription: normalizeSubscription(order.subscription),
  };
}

export async function listPublicPlans(options: ApiRequestOptions = {}) {
  const response = await apiRequest<RawPublicPlansListResponse>(
    apiRoutes.public.plans,
    options,
  );

  return {
    items: response.items.map(normalizePlan),
    total: response.total,
  } satisfies PublicPlansListResponse;
}

export async function getPublicPlan(
  planId: string,
  options: ApiRequestOptions = {},
) {
  const response = await apiRequest<RawPublicPlan>(
    apiRoutes.public.plan(planId),
    options,
  );

  return normalizePlan(response) satisfies PublicPlan;
}

export async function getCurrentEntitlements(accessToken: string) {
  const response = await apiRequest<RawEntitlementsListResponse>(
    apiRoutes.entitlements.me,
    {
      accessToken,
    },
  );

  return {
    items: response.items.map(normalizeEntitlement),
    total: response.total,
  } satisfies EntitlementsListResponse;
}

export async function createCheckout(
  input: CreateCheckoutInput,
  accessToken: string,
  idempotencyKey?: string | null,
) {
  const response = await apiRequest<RawCheckoutResponse>(
    apiRoutes.payments.checkout,
    {
      method: "POST",
      accessToken,
      body: input,
      headers: idempotencyKey
        ? {
            "x-idempotency-key": idempotencyKey,
          }
        : undefined,
    },
  );

  return normalizePaymentOrder(response) satisfies CheckoutResponse;
}

export async function getPaymentOrderStatus(
  orderId: string,
  accessToken: string,
) {
  const response = await apiRequest<RawPaymentOrder>(
    apiRoutes.payments.orderStatus(orderId),
    {
      accessToken,
    },
  );

  return normalizePaymentOrder(response) satisfies PaymentOrder;
}
