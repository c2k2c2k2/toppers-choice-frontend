import type {
  ApiJsonRequestBody,
  ApiJsonResponse,
} from "@/lib/api/openapi";

export type RawPublicPlansListResponse = ApiJsonResponse<
  "/api/v1/public/plans",
  "get"
>;
export type RawPublicPlan = ApiJsonResponse<
  "/api/v1/public/plans/{planId}",
  "get"
>;
export type RawEntitlementsListResponse = ApiJsonResponse<
  "/api/v1/entitlements/me",
  "get"
>;
export type RawCheckoutResponse = ApiJsonResponse<
  "/api/v1/payments/checkout",
  "post"
>;
export type RawPaymentOrder = ApiJsonResponse<
  "/api/v1/payments/orders/{orderId}/status",
  "get"
>;

export type CreateCheckoutInput = ApiJsonRequestBody<
  "/api/v1/payments/checkout",
  "post"
>;
export type EntitlementKind =
  RawPublicPlan["entitlements"][number]["entitlementKind"];
export type PaymentOrderStatus = RawPaymentOrder["status"];
export type PaymentProvider = RawPaymentOrder["provider"];
export type EntitlementSourceType =
  RawEntitlementsListResponse["items"][number]["sourceType"];
export type PremiumIntent =
  | "all"
  | "content"
  | "notes"
  | "practice"
  | "tests";

export interface PublicPlanEntitlement
  extends Omit<RawPublicPlan["entitlements"][number], "scopeJson"> {
  scopeJson: Record<string, unknown> | null;
}

export interface Plan
  extends Omit<
    RawPublicPlan,
    "description" | "entitlements" | "metadataJson" | "shortDescription"
  > {
  description: string | null;
  entitlements: PublicPlanEntitlement[];
  metadataJson: Record<string, unknown> | null;
  shortDescription: string | null;
}

export type PublicPlan = Plan;

export interface PublicPlansListResponse {
  items: PublicPlan[];
  total: number;
}

export interface Subscription
  extends Omit<
    NonNullable<RawPaymentOrder["subscription"]>,
    "cancelledAt" | "metadataJson" | "plan" | "revokedAt" | "revokedReason"
  > {
  cancelledAt: string | null;
  metadataJson: Record<string, unknown> | null;
  plan: Plan;
  revokedAt: string | null;
  revokedReason: string | null;
}

export type PaymentOrderUserSummary = RawPaymentOrder["user"];

export type EntitlementPaymentOrderSummary = NonNullable<
  RawEntitlementsListResponse["items"][number]["paymentOrder"]
>;

export type EntitlementGrantedByUser = NonNullable<
  RawEntitlementsListResponse["items"][number]["grantedByUser"]
>;

export interface Entitlement
  extends Omit<
    RawEntitlementsListResponse["items"][number],
    | "endsAt"
    | "grantedByUser"
    | "metadataJson"
    | "paymentOrder"
    | "plan"
    | "revokedAt"
    | "revokedReason"
    | "scopeJson"
    | "subscription"
  > {
  endsAt: string | null;
  grantedByUser: EntitlementGrantedByUser | null;
  metadataJson: Record<string, unknown> | null;
  paymentOrder: EntitlementPaymentOrderSummary | null;
  plan: Plan | null;
  revokedAt: string | null;
  revokedReason: string | null;
  scopeJson: Record<string, unknown> | null;
  subscription: Subscription | null;
}

export interface EntitlementsListResponse {
  items: Entitlement[];
  total: number;
}

export interface PaymentOrder
  extends Omit<
    RawPaymentOrder,
    | "callbackConfirmedAt"
    | "confirmedAt"
    | "expiresAt"
    | "failedAt"
    | "lastCheckedAt"
    | "metadataJson"
    | "providerOrderId"
    | "providerReferenceId"
    | "providerStatus"
    | "redirectUrl"
    | "plan"
    | "subscription"
  > {
  callbackConfirmedAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  failedAt: string | null;
  lastCheckedAt: string | null;
  metadataJson: Record<string, unknown> | null;
  plan: Plan;
  providerOrderId: string | null;
  providerReferenceId: string | null;
  providerStatus: string | null;
  redirectUrl: string | null;
  subscription: Subscription | null;
}

export type CheckoutResponse = PaymentOrder;
