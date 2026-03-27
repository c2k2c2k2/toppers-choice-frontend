import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminAuditLogListQuery,
  AdminRole,
  AdminRolesListResponse,
  AdminUser,
  AdminUserListQuery,
  AdminUsersListResponse,
  CreateAdminUserInput,
  CreateRoleInput,
  CreateStudentUserInput,
  SetUserAccessInput,
  UpdateRoleInput,
  UpdateUserStatusInput,
  UserAccessResponse,
  AuditLogsListResponse,
  AdminPermissionsListResponse,
} from "@/lib/admin/types";

export async function listAdminUsers(
  accessToken: string,
  query: AdminUserListQuery = {},
) {
  return apiRequest<AdminUsersListResponse>(
    withQuery(apiRoutes.admin.users.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function createAdminStudent(
  input: CreateStudentUserInput,
  accessToken: string,
) {
  return apiRequest<AdminUser>(apiRoutes.admin.users.students, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function createAdminUser(
  input: CreateAdminUserInput,
  accessToken: string,
) {
  return apiRequest<AdminUser>(apiRoutes.admin.users.admins, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminUserStatus(
  userId: string,
  input: UpdateUserStatusInput,
  accessToken: string,
) {
  return apiRequest<AdminUser>(apiRoutes.admin.users.status(userId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function listAdminPermissions(accessToken: string) {
  const response = await apiRequest<AdminPermissionsListResponse>(
    apiRoutes.admin.access.permissions,
    {
      accessToken,
    },
  );

  return response.items;
}

export async function listAdminRoles(accessToken: string) {
  const response = await apiRequest<AdminRolesListResponse>(
    apiRoutes.admin.access.roles,
    {
      accessToken,
    },
  );

  return response.items;
}

export async function createAdminRole(
  input: CreateRoleInput,
  accessToken: string,
) {
  return apiRequest<AdminRole>(apiRoutes.admin.access.roles, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminRole(
  roleId: string,
  input: UpdateRoleInput,
  accessToken: string,
) {
  return apiRequest<AdminRole>(apiRoutes.admin.access.role(roleId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function getAdminUserAccess(
  userId: string,
  accessToken: string,
) {
  return apiRequest<UserAccessResponse>(apiRoutes.admin.access.userAccess(userId), {
    accessToken,
  });
}

export async function setAdminUserAccess(
  userId: string,
  input: SetUserAccessInput,
  accessToken: string,
) {
  return apiRequest<UserAccessResponse>(apiRoutes.admin.access.userAccess(userId), {
    method: "PUT",
    accessToken,
    body: input,
  });
}

export async function listAdminAuditLogs(
  accessToken: string,
  query: AdminAuditLogListQuery = {},
) {
  return apiRequest<AuditLogsListResponse>(
    withQuery(apiRoutes.admin.audit.logs, query ?? {}),
    {
      accessToken,
    },
  );
}
