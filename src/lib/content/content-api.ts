import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  ContentDetail,
  ContentListFilters,
  PublicContentDetail,
  PublicContentListResponse,
  StudentContentListResponse,
} from "@/lib/content/types";

function buildAuthedOptions(
  accessToken: string,
  options: ApiRequestOptions = {},
): ApiRequestOptions {
  return {
    ...options,
    accessToken,
    cache: options.cache ?? "no-store",
  };
}

function buildContentQuery(filters: ContentListFilters = {}) {
  return {
    examTrackId: filters.examTrackId ?? null,
    family: filters.family ?? null,
    featuredOnly: filters.featuredOnly ?? null,
    format: filters.format ?? null,
    mediumId: filters.mediumId ?? null,
    search: filters.search ?? null,
  };
}

export function getStudentContent(
  accessToken: string,
  filters: ContentListFilters = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentContentListResponse>(
    withQuery(apiRoutes.content.list, buildContentQuery(filters)),
    buildAuthedOptions(accessToken, options),
  );
}

export function getStudentContentDetail(
  slug: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<ContentDetail>(
    apiRoutes.content.detail(slug),
    buildAuthedOptions(accessToken, options),
  );
}

export function getPublicContent(
  filters: ContentListFilters = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PublicContentListResponse>(
    withQuery(apiRoutes.content.publicList, buildContentQuery(filters)),
    {
      ...options,
      cache: options.cache ?? "no-store",
    },
  );
}

export function getPublicContentDetail(
  slug: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PublicContentDetail>(apiRoutes.content.publicDetail(slug), {
    ...options,
    cache: options.cache ?? "no-store",
  });
}
