import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminOpsDashboard,
  AdminPermission,
  AdminRole,
} from "@/lib/admin/types";

export async function getAdminOpsDashboard(accessToken: string) {
  return apiRequest<AdminOpsDashboard>(apiRoutes.admin.ops.dashboard, {
    accessToken,
  });
}

export async function listAdminPermissions(accessToken: string) {
  const response = await apiRequest<{ items: AdminPermission[] }>(
    apiRoutes.admin.access.permissions,
    {
      accessToken,
    },
  );

  return response.items;
}

export async function listAdminRoles(accessToken: string) {
  const response = await apiRequest<{ items: AdminRole[] }>(
    apiRoutes.admin.access.roles,
    {
      accessToken,
    },
  );

  return response.items;
}
