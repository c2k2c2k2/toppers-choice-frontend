import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminAnalyticsOverview,
  AdminContentHealth,
  AdminOpsDashboard,
  AdminSearchQuery,
  AdminSecuritySignalListQuery,
  NoteSecuritySignalsListResponse,
  SearchResponse,
} from "@/lib/admin/types";

export async function getAdminOpsDashboard(accessToken: string) {
  return apiRequest<AdminOpsDashboard>(apiRoutes.admin.ops.dashboard, {
    accessToken,
  });
}

export async function getAdminAnalyticsOverview(accessToken: string) {
  return apiRequest<AdminAnalyticsOverview>(apiRoutes.admin.analytics.overview, {
    accessToken,
  });
}

export async function getAdminContentHealth(accessToken: string) {
  return apiRequest<AdminContentHealth>(apiRoutes.admin.ops.contentHealth, {
    accessToken,
  });
}

export async function listAdminNoteSecuritySignals(
  accessToken: string,
  query: AdminSecuritySignalListQuery = {},
) {
  return apiRequest<NoteSecuritySignalsListResponse>(
    withQuery(apiRoutes.admin.ops.securitySignals, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function searchAdminWorkspace(
  accessToken: string,
  query: AdminSearchQuery,
) {
  return apiRequest<SearchResponse>(
    withQuery(apiRoutes.admin.search.list, query),
    {
      accessToken,
    },
  );
}

export async function revokeAdminUserSessions(
  userId: string,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(apiRoutes.admin.ops.revokeUserSessions(userId), {
    method: "POST",
    accessToken,
  });
}

export async function revokeAdminNoteViewSession(
  noteViewSessionId: string,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    apiRoutes.admin.ops.revokeNoteViewSession(noteViewSessionId),
    {
      method: "POST",
      accessToken,
    },
  );
}
