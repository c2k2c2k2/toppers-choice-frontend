"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminRole,
  createAdminStudent,
  createAdminUser,
  formatAdminDateTime,
  getAdminUserAccess,
  grantAdminEntitlement,
  listAdminAuditLogs,
  listAdminPermissions,
  listAdminPlans,
  listAdminRoles,
  listAdminUserEntitlements,
  listAdminUsers,
  revokeAdminEntitlement,
  revokeAdminUserSessions,
  setAdminUserAccess,
  stringifyJsonInput,
  updateAdminRole,
  updateAdminUserStatus,
  type AdminRole,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type PeopleTab = "users" | "audit";

interface CreateUserFormState {
  email: string;
  fullName: string;
  password: string;
  userType: "STUDENT" | "ADMIN";
}

interface AccessFormState {
  permissionOverridesJson: string;
  roleIds: string[];
}

interface RoleFormState {
  code: string;
  description: string;
  isActive: boolean;
  name: string;
  permissionKeysText: string;
}

interface GrantEntitlementFormState {
  endsAt: string;
  kind: "NOTES_PREMIUM" | "CONTENT_PREMIUM" | "PRACTICE_PREMIUM" | "TESTS_PREMIUM" | "ALL_PREMIUM";
  metadataJson: string;
  planId: string;
  startsAt: string;
}

const EMPTY_CREATE_USER_FORM_STATE: CreateUserFormState = {
  email: "",
  fullName: "",
  password: "",
  userType: "STUDENT",
};

const EMPTY_ACCESS_FORM_STATE: AccessFormState = {
  permissionOverridesJson: "",
  roleIds: [],
};

const EMPTY_ROLE_FORM_STATE: RoleFormState = {
  code: "",
  description: "",
  isActive: true,
  name: "",
  permissionKeysText: "",
};

const EMPTY_GRANT_FORM_STATE: GrantEntitlementFormState = {
  endsAt: "",
  kind: "ALL_PREMIUM",
  metadataJson: "",
  planId: "",
  startsAt: "",
};

function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function formatOptionalAdminDateTime(value: unknown) {
  return formatAdminDateTime(getOptionalText(value));
}

function buildRoleFormState(role: AdminRole | null): RoleFormState {
  if (!role) {
    return EMPTY_ROLE_FORM_STATE;
  }

  return {
    code: role.code,
    description: typeof role.description === "string" ? role.description : "",
    isActive: role.isActive,
    name: role.name,
    permissionKeysText: role.permissionKeys.join(", "),
  };
}

export function AdminPeopleScreen({
  initialTab,
}: Readonly<{
  initialTab: PeopleTab;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const canReadUsers = authSession.hasPermission("admin.users.read");
  const canManageUsers = authSession.hasPermission("admin.users.manage");
  const canCreateStudents = authSession.hasPermission("admin.users.students.create");
  const canReadRoleRegistry = authSession.hasPermission("admin.roles.read");
  const canManageRoleRegistry = authSession.hasPermission("admin.roles.manage");
  const canReadUserAccess = authSession.hasPermission("admin.users.roles.read");
  const canManageUserAccess = authSession.hasPermission("admin.users.roles.manage");
  const canReadAudit = authSession.hasPermission("admin.audit.read");
  const canReadPayments = authSession.hasPermission("payments.read");
  const canManagePayments = authSession.hasPermission("payments.manage");
  const canSupport = authSession.hasPermission("admin.ops.support");

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INVITED" | "SUSPENDED" | "">("");
  const [userTypeFilter, setUserTypeFilter] = useState<"STUDENT" | "ADMIN" | "">("");
  const [limitFilter, setLimitFilter] = useState("20");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createUserForm, setCreateUserForm] = useState<CreateUserFormState>(
    EMPTY_CREATE_USER_FORM_STATE,
  );
  const [userStatus, setUserStatus] = useState<"ACTIVE" | "INVITED" | "SUSPENDED">("ACTIVE");
  const [accessForm, setAccessForm] = useState<AccessFormState>(EMPTY_ACCESS_FORM_STATE);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM_STATE);
  const [grantForm, setGrantForm] = useState<GrantEntitlementFormState>(EMPTY_GRANT_FORM_STATE);
  const [revokeReason, setRevokeReason] = useState("Manual support revocation");
  const [auditAction, setAuditAction] = useState("");
  const [auditResourceType, setAuditResourceType] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const usersQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadUsers,
    queryFn: (accessToken) =>
      listAdminUsers(accessToken, {
        limit: Number.parseInt(limitFilter, 10) || undefined,
        q: searchValue || undefined,
        status: statusFilter || undefined,
        userType: userTypeFilter || undefined,
      }),
    queryKey: adminQueryKeys.users({
      limit: Number.parseInt(limitFilter, 10) || null,
      q: searchValue || null,
      status: statusFilter || null,
      userType: userTypeFilter || null,
    }),
    staleTime: 30_000,
  });

  const rolesQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadRoleRegistry,
    queryFn: listAdminRoles,
    queryKey: adminQueryKeys.roles(),
    staleTime: 60_000,
  });

  const permissionsQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadRoleRegistry,
    queryFn: listAdminPermissions,
    queryKey: adminQueryKeys.permissions(),
    staleTime: 60_000,
  });

  const accessQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadUserAccess && Boolean(selectedUserId),
    queryFn: (accessToken) => getAdminUserAccess(selectedUserId ?? "", accessToken),
    queryKey: adminQueryKeys.userAccess(selectedUserId ?? "new"),
    staleTime: 30_000,
  });

  const entitlementsQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadPayments && Boolean(selectedUserId),
    queryFn: (accessToken) => listAdminUserEntitlements(selectedUserId ?? "", accessToken),
    queryKey: adminQueryKeys.entitlements(selectedUserId ?? "new"),
    staleTime: 30_000,
  });

  const plansQuery = useAuthenticatedQuery({
    enabled: initialTab === "users" && canReadPayments,
    queryFn: (accessToken) => listAdminPlans(accessToken, {}),
    queryKey: adminQueryKeys.plans({ search: null, status: null }),
    staleTime: 60_000,
  });

  const auditQuery = useAuthenticatedQuery({
    enabled: initialTab === "audit" && canReadAudit,
    queryFn: (accessToken) =>
      listAdminAuditLogs(accessToken, {
        action: auditAction || undefined,
        actorUserId: searchValue || undefined,
        limit: 50,
        resourceType: auditResourceType || undefined,
      }),
    queryKey: adminQueryKeys.audit({
      action: auditAction || null,
      actorUserId: searchValue || null,
      limit: 50,
      resourceId: null,
      resourceType: auditResourceType || null,
    }),
    staleTime: 30_000,
  });

  const selectedUser = useMemo(() => {
    const items = usersQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }

    return items.find((user) => user.id === selectedUserId) ?? items[0];
  }, [selectedUserId, usersQuery.data?.items]);

  const selectedRole = useMemo(() => {
    const items = rolesQuery.data ?? [];
    if (!items.length) {
      return null;
    }

    return items.find((role) => role.id === selectedRoleId) ?? items[0];
  }, [rolesQuery.data, selectedRoleId]);

  useEffect(() => {
    if (selectedUser) {
      setUserStatus(selectedUser.status);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (accessQuery.data) {
      setAccessForm({
        permissionOverridesJson: stringifyJsonInput(
          accessQuery.data.directOverrides.map((override) => ({
            isAllowed: override.isAllowed,
            permissionKey: override.permissionKey,
            reason: override.reason,
          })),
        ),
        roleIds: accessQuery.data.roles.map((role) => role.id),
      });
    } else {
      setAccessForm(EMPTY_ACCESS_FORM_STATE);
    }
  }, [accessQuery.data]);

  useEffect(() => {
    setRoleForm(buildRoleFormState(selectedRole));
  }, [selectedRole]);

  const createUserMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        email: createUserForm.email.trim(),
        fullName: createUserForm.fullName.trim(),
        password: createUserForm.password.trim(),
      };

      if (!input.email || !input.fullName || !input.password) {
        throw new Error("Full name, email, and password are required.");
      }

      if (createUserForm.userType === "STUDENT") {
        if (!canCreateStudents) {
          throw new Error("This session cannot create students.");
        }

        return createAdminStudent(input, accessToken);
      }

      return createAdminUser(input, accessToken);
    },
    onSuccess: async () => {
      setCreateUserForm(EMPTY_CREATE_USER_FORM_STATE);
      setMessage("User created.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const updateUserStatusMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!selectedUser) {
        throw new Error("Select a user first.");
      }

      return updateAdminUserStatus(
        selectedUser.id,
        {
          status: userStatus,
        },
        accessToken,
      );
    },
    onSuccess: async () => {
      setMessage("User status updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const saveAccessMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!selectedUser) {
        throw new Error("Select a user first.");
      }

      return setAdminUserAccess(
        selectedUser.id,
        {
          permissionOverrides: accessForm.permissionOverridesJson.trim()
            ? (JSON.parse(accessForm.permissionOverridesJson) as Array<{
                isAllowed: boolean;
                permissionKey: string;
                reason?: string | null;
              }>)
            : undefined,
          roleIds: accessForm.roleIds,
        },
        accessToken,
      );
    },
    onSuccess: async () => {
      setMessage("User access updated.");
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.userAccess(selectedUserId ?? "new"),
      });
    },
  });

  const saveRoleMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        code: roleForm.code.trim(),
        description: roleForm.description.trim() || undefined,
        isActive: roleForm.isActive,
        name: roleForm.name.trim(),
        permissionKeys: roleForm.permissionKeysText
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (!input.code || !input.name) {
        throw new Error("Role code and name are required.");
      }

      if (selectedRole) {
        return updateAdminRole(selectedRole.id, input, accessToken);
      }

      return createAdminRole(input, accessToken);
    },
    onSuccess: async (role) => {
      setSelectedRoleId(role.id);
      setMessage("Role definition saved.");
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.roles() });
    },
  });

  const grantEntitlementMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!selectedUser) {
        throw new Error("Select a user first.");
      }

      return grantAdminEntitlement(
        {
          endsAt: toIsoDateTime(grantForm.endsAt),
          kind: grantForm.planId ? undefined : grantForm.kind,
          metadataJson: grantForm.metadataJson.trim()
            ? (JSON.parse(grantForm.metadataJson) as Record<string, never>)
            : undefined,
          planId: grantForm.planId || undefined,
          startsAt: toIsoDateTime(grantForm.startsAt),
          userId: selectedUser.id,
        },
        accessToken,
      );
    },
    onSuccess: async () => {
      setGrantForm(EMPTY_GRANT_FORM_STATE);
      setMessage("Entitlement grant saved.");
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.entitlements(selectedUserId ?? "new"),
      });
    },
  });

  const revokeEntitlementMutation = useAuthenticatedMutation({
    mutationFn: async (entitlementId: string, accessToken) => {
      return revokeAdminEntitlement(
        entitlementId,
        {
          reason: revokeReason.trim() || "Manual support revocation",
        },
        accessToken,
      );
    },
    onSuccess: async () => {
      setMessage("Entitlement revoked.");
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.entitlements(selectedUserId ?? "new"),
      });
    },
  });

  const revokeSessionsMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!selectedUser) {
        throw new Error("Select a user first.");
      }

      return revokeAdminUserSessions(selectedUser.id, accessToken);
    },
    onSuccess: async () => {
      setMessage("User sessions revoked.");
    },
  });

  if ((initialTab === "users" && !canReadUsers) || (initialTab === "audit" && !canReadAudit)) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This people workspace is locked."
        description="The current admin session does not expose the permission needed for this route."
      />
    );
  }

  if (
    (initialTab === "users" &&
      (usersQuery.isLoading ||
        rolesQuery.isLoading ||
        permissionsQuery.isLoading ||
        accessQuery.isLoading ||
        entitlementsQuery.isLoading ||
        plansQuery.isLoading)) ||
    (initialTab === "audit" && auditQuery.isLoading)
  ) {
    return (
      <LoadingState
        title={`Loading ${initialTab} workspace`}
        description="Pulling user, access, entitlement, role, and audit data from the backend admin contracts."
      />
    );
  }

  if (
    (initialTab === "users" &&
      (usersQuery.error ||
        rolesQuery.error ||
        permissionsQuery.error ||
        accessQuery.error ||
        entitlementsQuery.error ||
        plansQuery.error)) ||
    (initialTab === "audit" && auditQuery.error)
  ) {
    return (
      <ErrorState
        title="The people workspace could not be loaded."
        description="One or more admin support queries failed."
        onRetry={() => {
          if (initialTab === "users") {
            void usersQuery.refetch();
            void rolesQuery.refetch();
            void permissionsQuery.refetch();
            void accessQuery.refetch();
            void entitlementsQuery.refetch();
            void plansQuery.refetch();
            return;
          }

          void auditQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="People and access"
        title={initialTab === "users" ? "Users, roles, and entitlements are now manageable." : "Audit visibility is now available."}
        description={
          initialTab === "users"
            ? "This workspace now ties user status, role assignments, permission overrides, entitlement support actions, and session revocation into one contract-driven admin surface."
            : "Audit visibility stays read-only and backend-authored, but admins can now filter and inspect operational changes directly from the frontend."
        }
      />

      <AdminRouteTabs
        activeHref={initialTab === "users" ? "/admin/users" : "/admin/audit"}
        items={[
          {
            href: "/admin/users",
            label: "Users and access",
            description: "User status, access grants, roles, entitlements, and support actions.",
          },
          {
            href: "/admin/audit",
            label: "Audit",
            description: "Operational and publishing action history.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={
          initialTab === "users"
            ? "Search users by email or full name"
            : "Use this as actor user ID when filtering audit logs"
        }
        resultSummary={`${
          initialTab === "users"
            ? usersQuery.data?.items.length ?? 0
            : auditQuery.data?.items.length ?? 0
        } ${initialTab === "users" ? "records" : "audit entries"} visible.`}
      >
        {initialTab === "users" ? (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ACTIVE" | "INVITED" | "SUSPENDED" | "",
                  )
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INVITED">INVITED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">User type</span>
              <select
                value={userTypeFilter}
                onChange={(event) =>
                  setUserTypeFilter(event.target.value as "STUDENT" | "ADMIN" | "")
                }
                className="tc-input"
              >
                <option value="">All users</option>
                <option value="STUDENT">STUDENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="tc-form-field min-w-[10rem]">
              <span className="tc-form-label">Limit</span>
              <select
                value={limitFilter}
                onChange={(event) => setLimitFilter(event.target.value)}
                className="tc-input"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <AdminInput
              label="Action"
              value={auditAction}
              onChange={(event) => setAuditAction(event.target.value)}
            />
            <AdminInput
              label="Resource type"
              value={auditResourceType}
              onChange={(event) => setAuditResourceType(event.target.value)}
            />
          </>
        )}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

      {initialTab === "users" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(26rem,1fr)]">
          <section className="space-y-6">
            <AdminDataTable
              rows={usersQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedUser?.id ?? null}
              onRowClick={(row) => setSelectedUserId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Users"
                  title="No users matched the current filters."
                  description="Broaden the filters or create a new user to continue."
                />
              }
              columns={[
                {
                  header: "Identity",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">
                        {getOptionalText(row.fullName) ?? "Unnamed user"}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {getOptionalText(row.email) ?? "No email"}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Type",
                  render: (row) => <AdminToneBadge label={row.userType} tone="info" />,
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "ACTIVE" ? "live" : row.status === "SUSPENDED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Last login",
                  render: (row) => formatOptionalAdminDateTime(row.lastLoginAt),
                },
              ]}
            />

            <section className="tc-card rounded-[28px] p-6">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                Create user
              </h2>
              <div className="mt-4 grid gap-4">
                <AdminSelect
                  label="User type"
                  value={createUserForm.userType}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      userType: event.target.value as "STUDENT" | "ADMIN",
                    }))
                  }
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </AdminSelect>
                <AdminInput
                  label="Full name"
                  value={createUserForm.fullName}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Password"
                  type="password"
                  value={createUserForm.password}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageUsers || createUserMutation.isPending}
                  onClick={() => createUserMutation.mutate()}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create user"}
                </button>
              </div>
            </section>
          </section>

          <section className="space-y-6">
            {selectedUser ? (
              <section className="tc-card rounded-[28px] p-6">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  {getOptionalText(selectedUser.fullName) ?? "Unnamed user"}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {getOptionalText(selectedUser.email) ?? "No email"} · {selectedUser.userType}
                </p>
                <div className="mt-4 grid gap-4">
                  <AdminSelect
                    label="Status"
                    value={userStatus}
                    onChange={(event) =>
                      setUserStatus(
                        event.target.value as "ACTIVE" | "INVITED" | "SUSPENDED",
                      )
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INVITED">INVITED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </AdminSelect>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="tc-button-primary"
                      disabled={!canManageUsers || updateUserStatusMutation.isPending}
                      onClick={() => updateUserStatusMutation.mutate()}
                    >
                      {updateUserStatusMutation.isPending ? "Saving..." : "Save status"}
                    </button>
                    <button
                      type="button"
                      className="tc-button-secondary"
                      disabled={!canSupport || revokeSessionsMutation.isPending}
                      onClick={() => revokeSessionsMutation.mutate()}
                    >
                      {revokeSessionsMutation.isPending ? "Revoking..." : "Revoke sessions"}
                    </button>
                  </div>
                </div>

                {canReadUserAccess ? (
                  <div className="mt-6 grid gap-4">
                    <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                      Access grants
                    </h3>
                    <div className="grid gap-2">
                      {(rolesQuery.data ?? []).map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={accessForm.roleIds.includes(role.id)}
                            onChange={(event) =>
                              setAccessForm((current) => ({
                                ...current,
                                roleIds: event.target.checked
                                  ? [...current.roleIds, role.id]
                                  : current.roleIds.filter((item) => item !== role.id),
                              }))
                            }
                          />
                          <span>
                            <strong>{getOptionalText(role.name) ?? "Untitled role"}</strong> ·{" "}
                            {getOptionalText(role.code) ?? "No code"}
                          </span>
                        </label>
                      ))}
                    </div>
                    <AdminTextarea
                      label="Permission overrides JSON"
                      value={accessForm.permissionOverridesJson}
                      onChange={(event) =>
                        setAccessForm((current) => ({
                          ...current,
                          permissionOverridesJson: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="tc-button-primary"
                      disabled={!canManageUserAccess || saveAccessMutation.isPending}
                      onClick={() => saveAccessMutation.mutate()}
                    >
                      {saveAccessMutation.isPending ? "Saving..." : "Save access grants"}
                    </button>
                  </div>
                ) : null}

                {canReadPayments ? (
                  <div className="mt-6 grid gap-4">
                    <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                      Entitlements
                    </h3>
                    <div className="grid gap-3">
                      {(entitlementsQuery.data?.items ?? []).map((entitlement) => (
                        <div
                          key={entitlement.id}
                          className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/80 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[color:var(--brand)]">
                                {entitlement.kind}
                              </p>
                              <p className="text-xs text-[color:var(--muted)]">
                                {formatOptionalAdminDateTime(entitlement.startsAt)} to{" "}
                                {formatOptionalAdminDateTime(entitlement.endsAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="tc-button-secondary"
                              disabled={!canManagePayments || revokeEntitlementMutation.isPending}
                              onClick={() => revokeEntitlementMutation.mutate(entitlement.id)}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <AdminSelect
                      label="Plan"
                      value={grantForm.planId}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          planId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Grant by entitlement kind</option>
                      {(plansQuery.data?.items ?? []).map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </AdminSelect>
                    <AdminSelect
                      label="Kind"
                      value={grantForm.kind}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          kind: event.target.value as GrantEntitlementFormState["kind"],
                        }))
                      }
                    >
                      <option value="ALL_PREMIUM">ALL_PREMIUM</option>
                      <option value="NOTES_PREMIUM">NOTES_PREMIUM</option>
                      <option value="CONTENT_PREMIUM">CONTENT_PREMIUM</option>
                      <option value="PRACTICE_PREMIUM">PRACTICE_PREMIUM</option>
                      <option value="TESTS_PREMIUM">TESTS_PREMIUM</option>
                    </AdminSelect>
                    <div className="grid gap-4 md:grid-cols-2">
                      <AdminInput
                        label="Starts at"
                        type="datetime-local"
                        value={grantForm.startsAt}
                        onChange={(event) =>
                          setGrantForm((current) => ({
                            ...current,
                            startsAt: event.target.value,
                          }))
                        }
                      />
                      <AdminInput
                        label="Ends at"
                        type="datetime-local"
                        value={grantForm.endsAt}
                        onChange={(event) =>
                          setGrantForm((current) => ({
                            ...current,
                            endsAt: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <AdminTextarea
                      label="Grant metadata JSON"
                      value={grantForm.metadataJson}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          metadataJson: event.target.value,
                        }))
                      }
                    />
                    <AdminInput
                      label="Revoke reason"
                      value={revokeReason}
                      onChange={(event) => setRevokeReason(event.target.value)}
                    />
                    <button
                      type="button"
                      className="tc-button-primary"
                      disabled={!canManagePayments || grantEntitlementMutation.isPending}
                      onClick={() => grantEntitlementMutation.mutate()}
                    >
                      {grantEntitlementMutation.isPending ? "Granting..." : "Grant entitlement"}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : (
              <EmptyState
                eyebrow="Users"
                title="Select a user to manage access and support actions."
                description="Status changes, access grants, entitlements, and session support tools appear here."
              />
            )}

            {canReadRoleRegistry ? (
              <section className="tc-card rounded-[28px] p-6">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  Role registry
                </h2>
                <div className="mt-4 grid gap-3">
                  <select
                    className="tc-input"
                    value={selectedRole?.id ?? ""}
                    onChange={(event) => setSelectedRoleId(event.target.value || null)}
                  >
                    <option value="">New role</option>
                    {(rolesQuery.data ?? []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <AdminInput
                    label="Role code"
                    value={roleForm.code}
                    onChange={(event) =>
                      setRoleForm((current) => ({ ...current, code: event.target.value }))
                    }
                  />
                  <AdminInput
                    label="Role name"
                    value={roleForm.name}
                    onChange={(event) =>
                      setRoleForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <AdminTextarea
                    label="Description"
                    value={roleForm.description}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                  <AdminTextarea
                    label="Permission keys"
                    hint={`Available definitions: ${(permissionsQuery.data ?? []).length}`}
                    value={roleForm.permissionKeysText}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        permissionKeysText: event.target.value,
                      }))
                    }
                  />
                  <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
                    <input
                      type="checkbox"
                      checked={roleForm.isActive}
                      onChange={(event) =>
                        setRoleForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                    Role is active for assignment.
                  </label>
                  <button
                    type="button"
                    className="tc-button-primary"
                    disabled={!canManageRoleRegistry || saveRoleMutation.isPending}
                    onClick={() => saveRoleMutation.mutate()}
                  >
                    {saveRoleMutation.isPending ? "Saving..." : "Save role"}
                  </button>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      ) : (
        <AdminDataTable
          rows={auditQuery.data?.items ?? []}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              eyebrow="Audit"
              title="No audit events matched the current filters."
              description="Try a different action or resource filter."
            />
          }
          columns={[
            {
              header: "Action",
              render: (row) => (
                <div className="space-y-1">
                  <p className="font-semibold text-[color:var(--brand)]">{row.action}</p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {row.resourceType}
                    {typeof row.resourceId === "string" ? ` · ${row.resourceId}` : ""}
                  </p>
                </div>
              ),
            },
            {
              header: "Actor",
              render: (row) => (
                <p className="text-sm text-[color:var(--muted)]">
                  {getOptionalText(row.actor?.email) ?? "System"}
                </p>
              ),
            },
            {
              header: "Meta",
              render: (row) => (
                <p className="max-w-[16rem] truncate text-sm text-[color:var(--muted)]">
                  {row.meta ? JSON.stringify(row.meta) : "No metadata"}
                </p>
              ),
            },
            {
              header: "Created",
              render: (row) => formatOptionalAdminDateTime(row.createdAt),
            },
          ]}
        />
      )}
    </div>
  );
}
