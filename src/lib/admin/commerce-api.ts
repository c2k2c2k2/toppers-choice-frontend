import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminPaymentOrderListQuery,
  AdminPlanListQuery,
  CreatePlanInput,
  Entitlement,
  EntitlementsListResponse,
  GrantEntitlementInput,
  PaymentOrder,
  PaymentOrdersListResponse,
  Plan,
  PlansListResponse,
  RevokeEntitlementInput,
  UpdatePlanInput,
} from "@/lib/admin/types";

export async function listAdminPlans(
  accessToken: string,
  query: AdminPlanListQuery = {},
) {
  return apiRequest<PlansListResponse>(
    withQuery(apiRoutes.admin.plans.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminPlan(planId: string, accessToken: string) {
  return apiRequest<Plan>(apiRoutes.admin.plans.detail(planId), {
    accessToken,
  });
}

export async function createAdminPlan(
  input: CreatePlanInput,
  accessToken: string,
) {
  return apiRequest<Plan>(apiRoutes.admin.plans.list, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminPlan(
  planId: string,
  input: UpdatePlanInput,
  accessToken: string,
) {
  return apiRequest<Plan>(apiRoutes.admin.plans.detail(planId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function listAdminPaymentOrders(
  accessToken: string,
  query: AdminPaymentOrderListQuery = {},
) {
  return apiRequest<PaymentOrdersListResponse>(
    withQuery(apiRoutes.admin.payments.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminPaymentOrder(
  orderId: string,
  accessToken: string,
) {
  return apiRequest<PaymentOrder>(apiRoutes.admin.payments.detail(orderId), {
    accessToken,
  });
}

export async function reconcileAdminPaymentOrder(
  orderId: string,
  accessToken: string,
) {
  return apiRequest<PaymentOrder>(apiRoutes.admin.payments.reconcile(orderId), {
    method: "POST",
    accessToken,
  });
}

export async function listAdminUserEntitlements(
  userId: string,
  accessToken: string,
) {
  return apiRequest<EntitlementsListResponse>(apiRoutes.admin.entitlements.byUser(userId), {
    accessToken,
  });
}

export async function grantAdminEntitlement(
  input: GrantEntitlementInput,
  accessToken: string,
) {
  return apiRequest<EntitlementsListResponse>(apiRoutes.admin.entitlements.grant, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function revokeAdminEntitlement(
  entitlementId: string,
  input: RevokeEntitlementInput,
  accessToken: string,
) {
  return apiRequest<Entitlement>(apiRoutes.admin.entitlements.revoke(entitlementId), {
    method: "POST",
    accessToken,
    body: input,
  });
}
