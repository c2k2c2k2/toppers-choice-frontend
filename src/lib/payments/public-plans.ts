import type { ApiRequestOptions } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { PublicPlan, PublicPlansListResponse } from "@/lib/payments/types";

export function listPublicPlans(options: ApiRequestOptions = {}) {
  return apiRequest<PublicPlansListResponse>(apiRoutes.public.plans, options);
}

export function getPublicPlan(
  planId: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PublicPlan>(apiRoutes.public.plan(planId), options);
}
