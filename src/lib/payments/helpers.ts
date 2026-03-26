import { isApiError } from "@/lib/api/errors";
import { sanitizeRedirectTarget } from "@/lib/auth/session-utils";
import type {
  Entitlement,
  EntitlementKind,
  PaymentOrderStatus,
  Plan,
  PremiumIntent,
  PublicPlan,
} from "@/lib/payments/types";

const ENTITLEMENT_KIND_LABELS: Record<EntitlementKind, string> = {
  ALL_PREMIUM: "All premium access",
  CONTENT_PREMIUM: "Guidance and structured content",
  NOTES_PREMIUM: "Notes library",
  PRACTICE_PREMIUM: "Practice premium",
  TESTS_PREMIUM: "Timed tests premium",
};

const INTENT_LABELS: Record<PremiumIntent, string> = {
  all: "all premium",
  content: "guidance and structured content",
  notes: "notes",
  practice: "practice",
  tests: "tests",
};

const INTENT_KINDS: Record<PremiumIntent, EntitlementKind[]> = {
  all: [
    "ALL_PREMIUM",
    "CONTENT_PREMIUM",
    "NOTES_PREMIUM",
    "PRACTICE_PREMIUM",
    "TESTS_PREMIUM",
  ],
  content: ["ALL_PREMIUM", "CONTENT_PREMIUM"],
  notes: ["ALL_PREMIUM", "NOTES_PREMIUM"],
  practice: ["ALL_PREMIUM", "PRACTICE_PREMIUM"],
  tests: ["ALL_PREMIUM", "TESTS_PREMIUM"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];
}

export function parsePremiumIntent(value: string | null | undefined): PremiumIntent {
  switch (value) {
    case "content":
    case "notes":
    case "practice":
    case "tests":
      return value;
    default:
      return "all";
  }
}

export function formatPlanPrice(plan: Pick<Plan, "currencyCode" | "pricePaise">) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currencyCode,
    maximumFractionDigits: 0,
  }).format(plan.pricePaise / 100);
}

export function formatPlanDuration(days: number) {
  if (days <= 0) {
    return "Flexible duration";
  }

  if (days === 1) {
    return "1 day";
  }

  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  return `${days} days`;
}

export function getEntitlementKindLabel(kind: EntitlementKind) {
  return ENTITLEMENT_KIND_LABELS[kind];
}

export function getPremiumIntentLabel(intent: PremiumIntent) {
  return INTENT_LABELS[intent];
}

export function getIntentKinds(intent: PremiumIntent) {
  return INTENT_KINDS[intent];
}

export function isActiveEntitlement(
  entitlement: Pick<Entitlement, "endsAt" | "kind" | "revokedAt" | "startsAt">,
  now = new Date(),
) {
  if (entitlement.revokedAt) {
    return false;
  }

  const startsAt = new Date(entitlement.startsAt).getTime();

  if (Number.isNaN(startsAt) || startsAt > now.getTime()) {
    return false;
  }

  if (!entitlement.endsAt) {
    return true;
  }

  const endsAt = new Date(entitlement.endsAt).getTime();

  return !Number.isNaN(endsAt) && endsAt > now.getTime();
}

export function isTerminalPaymentStatus(status: PaymentOrderStatus) {
  return (
    status === "SUCCEEDED" ||
    status === "FAILED" ||
    status === "CANCELLED" ||
    status === "EXPIRED"
  );
}

export function entitlementSupportsKind(
  entitlement: Pick<Entitlement, "kind">,
  kind: EntitlementKind,
) {
  return entitlement.kind === "ALL_PREMIUM" || entitlement.kind === kind;
}

export function planSupportsKind(
  plan: Pick<Plan, "entitlements">,
  kind: EntitlementKind,
) {
  return plan.entitlements.some((entitlement) =>
    entitlement.entitlementKind === "ALL_PREMIUM" ||
    entitlement.entitlementKind === kind,
  );
}

export function planSupportsIntent(
  plan: Pick<Plan, "entitlements">,
  intent: PremiumIntent,
) {
  const requiredKinds = getIntentKinds(intent);

  if (intent === "all") {
    return (
      planSupportsKind(plan, "ALL_PREMIUM") ||
      INTENT_KINDS.all
        .filter((kind) => kind !== "ALL_PREMIUM")
        .every((kind) => planSupportsKind(plan, kind))
    );
  }

  return requiredKinds.some((kind) => planSupportsKind(plan, kind));
}

export function entitlementSupportsIntent(
  entitlement: Pick<Entitlement, "kind">,
  intent: PremiumIntent,
) {
  if (intent === "all") {
    return entitlement.kind === "ALL_PREMIUM";
  }

  return getIntentKinds(intent).some((kind) =>
    entitlementSupportsKind(entitlement, kind),
  );
}

export function hasIntentAccess(
  entitlements: Entitlement[],
  intent: PremiumIntent,
  now = new Date(),
) {
  return entitlements.some((entitlement) => {
    return (
      isActiveEntitlement(entitlement, now) &&
      entitlementSupportsIntent(entitlement, intent)
    );
  });
}

export function isPlanCoveredByEntitlements(
  plan: Pick<Plan, "entitlements">,
  entitlements: Entitlement[],
  now = new Date(),
) {
  return plan.entitlements.every((planEntitlement) =>
    entitlements.some((entitlement) => {
      return (
        isActiveEntitlement(entitlement, now) &&
        entitlementSupportsKind(entitlement, planEntitlement.entitlementKind)
      );
    }),
  );
}

export function inferPlanIntent(plan: Pick<Plan, "entitlements">): PremiumIntent {
  if (planSupportsIntent(plan, "all")) {
    return "all";
  }

  if (planSupportsIntent(plan, "notes")) {
    return "notes";
  }

  if (planSupportsIntent(plan, "content")) {
    return "content";
  }

  if (planSupportsIntent(plan, "practice")) {
    return "practice";
  }

  if (planSupportsIntent(plan, "tests")) {
    return "tests";
  }

  return "all";
}

export function getPlanFeatureLabels(plan: Pick<Plan, "entitlements" | "metadataJson">) {
  const metadataFeatures = readStringArray(
    isRecord(plan.metadataJson) ? plan.metadataJson.features : null,
  );

  if (metadataFeatures.length > 0) {
    return metadataFeatures;
  }

  const entitlementFeatures = plan.entitlements.map((entitlement) =>
    getEntitlementKindLabel(entitlement.entitlementKind),
  );

  return entitlementFeatures.length > 0
    ? Array.from(new Set(entitlementFeatures))
    : ["Premium access configured from the backend plan contract."];
}

export function buildStudentPlansHref(input: {
  intent?: PremiumIntent | null;
  planId?: string | null;
  returnTo?: string | null;
  source?: string | null;
}) {
  const searchParams = new URLSearchParams();
  const intent = input.intent ?? "all";

  searchParams.set("intent", intent);

  if (input.planId) {
    searchParams.set("plan", input.planId);
  }

  if (input.source) {
    searchParams.set("source", input.source);
  }

  if (input.returnTo) {
    searchParams.set(
      "returnTo",
      sanitizeRedirectTarget(input.returnTo, "/student/plans"),
    );
  }

  return `/student/plans?${searchParams.toString()}`;
}

export function buildPaymentResultHref(input: {
  intent?: PremiumIntent | null;
  merchantOrderCode?: string | null;
  orderId: string;
  planId?: string | null;
  returnTo?: string | null;
  source?: string | null;
}) {
  const searchParams = new URLSearchParams({
    orderId: input.orderId,
  });

  if (input.intent) {
    searchParams.set("intent", input.intent);
  }

  if (input.planId) {
    searchParams.set("plan", input.planId);
  }

  if (input.merchantOrderCode) {
    searchParams.set("merchantOrderCode", input.merchantOrderCode);
  }

  if (input.source) {
    searchParams.set("source", input.source);
  }

  if (input.returnTo) {
    searchParams.set(
      "returnTo",
      sanitizeRedirectTarget(input.returnTo, "/student/plans"),
    );
  }

  return `/payments/result?${searchParams.toString()}`;
}

export function getPaymentStatusTone(status: PaymentOrderStatus) {
  switch (status) {
    case "SUCCEEDED":
      return "success";
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      return "error";
    default:
      return "pending";
  }
}

export function getPaymentStatusLabel(status: PaymentOrderStatus) {
  switch (status) {
    case "CREATED":
      return "Created";
    case "PENDING":
      return "Pending";
    case "SUCCEEDED":
      return "Succeeded";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export function getPaymentErrorMessage(error: unknown) {
  if (
    isApiError(error) &&
    [
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "PAYMENT_PROVIDER_MISCONFIGURED",
      "PAYMENT_PROVIDER_REQUEST_FAILED",
    ].includes(error.code)
  ) {
    return "Checkout is not configured in this environment yet. Access can still be granted manually from the admin panel for verification.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "The payment request could not be started right now.";
}

export function getPlanById(plans: PublicPlan[], planId: string | null | undefined) {
  if (!planId) {
    return null;
  }

  return plans.find((plan) => plan.id === planId) ?? null;
}
