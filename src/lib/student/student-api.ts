import {
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type {
  NotificationPreference,
  StudentAnalyticsSummary,
  StudentCatalogResponse,
  StudentCmsPage,
  StudentCmsResolveResponse,
  StudentDashboardBootstrap,
  StudentNotificationFeed,
} from "@/lib/student/types";

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

export function getStudentCatalog(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentCatalogResponse>(
    apiRoutes.catalog.authenticated,
    buildAuthedOptions(accessToken, options),
  );
}

export function resolveStudentCms(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentCmsResolveResponse>(
    apiRoutes.cms.studentResolve,
    buildAuthedOptions(accessToken, options),
  );
}

export function getStudentCmsPage(
  slug: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentCmsPage>(
    apiRoutes.cms.studentPage(slug),
    buildAuthedOptions(accessToken, options),
  );
}

export function getStudentAnalyticsSummary(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentAnalyticsSummary>(
    apiRoutes.analytics.meSummary,
    buildAuthedOptions(accessToken, options),
  );
}

export function getNotificationFeed(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentNotificationFeed>(
    apiRoutes.notifications.me,
    buildAuthedOptions(accessToken, options),
  );
}

export function getNotificationPreferences(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NotificationPreference[]>(
    apiRoutes.notifications.preferences,
    buildAuthedOptions(accessToken, options),
  );
}

export async function getStudentDashboardBootstrap(accessToken: string) {
  const [catalog, cms, analytics, notifications] = await Promise.all([
    getStudentCatalog(accessToken),
    resolveStudentCms(accessToken),
    getStudentAnalyticsSummary(accessToken),
    getNotificationFeed(accessToken),
  ]);

  return {
    analytics,
    catalog,
    cms,
    notifications,
  } satisfies StudentDashboardBootstrap;
}
