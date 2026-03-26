import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { CmsPage, CmsResolveResponse } from "@/lib/cms/types";

export function resolvePublicCms(options: ApiRequestOptions = {}) {
  return apiRequest<CmsResolveResponse>(apiRoutes.cms.resolve, options);
}

export function getPublicCmsPage(
  slug: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<CmsPage>(apiRoutes.cms.page(slug), options);
}
