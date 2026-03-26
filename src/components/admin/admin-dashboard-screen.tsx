"use client";

import Link from "next/link";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { queryKeys } from "@/lib/api/query-keys";
import {
  getAdminOpsDashboard,
  listAdminPermissions,
  listAdminRoles,
} from "@/lib/admin";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

export function AdminDashboardScreen() {
  const authSession = useAuthSession();
  const canReadOps = authSession.hasPermission("admin.ops.read");
  const canReadRoles = authSession.hasPermission("admin.roles.read");

  const dashboardQuery = useAuthenticatedQuery({
    enabled: canReadOps,
    queryFn: getAdminOpsDashboard,
    queryKey: queryKeys.admin.dashboard(),
    staleTime: 30_000,
  });
  const permissionsQuery = useAuthenticatedQuery({
    enabled: canReadRoles,
    queryFn: listAdminPermissions,
    queryKey: queryKeys.admin.permissions(),
    staleTime: 60_000,
  });
  const rolesQuery = useAuthenticatedQuery({
    enabled: canReadRoles,
    queryFn: listAdminRoles,
    queryKey: queryKeys.admin.roles(),
    staleTime: 60_000,
  });

  const hasBlockingError = dashboardQuery.error && canReadOps;

  if (dashboardQuery.isLoading && canReadOps) {
    return (
      <LoadingState
        title="Loading the admin foundation"
        description="Pulling dashboard signals, access metadata, and the shared CMS module map."
      />
    );
  }

  if (hasBlockingError) {
    return (
      <ErrorState
        title="The admin dashboard could not be loaded."
        description="The shared admin shell is ready, but the bootstrap data request failed."
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Admin foundation"
        title="Shared CRUD, CMS, and role-aware admin navigation are live."
        description="This shell now centralizes permissions, admin bootstrap metrics, and the reusable patterns that later content, assessment, users, and operations modules will extend."
        actions={
          <>
            <Link href="/admin/cms/pages" className="tc-button-primary">
              Open CMS workspace
            </Link>
            <Link href="/" className="tc-button-secondary">
              View public surface
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Session roles"
          value={authSession.access?.roles.length ?? 0}
          detail="Role assignments from the restored admin session."
        />
        <AdminMetricCard
          label="Effective permissions"
          value={authSession.access?.effectivePermissionKeys.length ?? 0}
          detail="Frontend gates mirror backend permission grants without replacing them."
        />
        <AdminMetricCard
          label="Admins"
          value={dashboardQuery.data?.users.admins ?? "—"}
          detail="Live count from admin ops bootstrap."
        />
        <AdminMetricCard
          label="Pending uploads"
          value={dashboardQuery.data?.operational.pendingUploads ?? "—"}
          detail="Useful for CMS and content teams watching incomplete media workflows."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="tc-card rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            What F10 unlocked
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="tc-panel rounded-[24px] p-5">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                CMS surfaces
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                Admins can now manage pages, banners, announcements, and stitched home sections from a shared CRUD flow.
              </p>
            </div>
            <div className="tc-panel rounded-[24px] p-5">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                Upload integration
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                CMS forms now link directly into the backend asset init-upload and confirm-upload contract.
              </p>
            </div>
            <div className="tc-panel rounded-[24px] p-5">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                Permission-aware nav
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                The shell reads the restored access graph so later modules can gate routes and actions without duplicating session logic.
              </p>
            </div>
            <div className="tc-panel rounded-[24px] p-5">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                F11-ready base
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                Shared filters, tables, forms, and mutation patterns are now in place for authoring, assessments, users, and ops.
              </p>
            </div>
          </div>
        </section>

        <section className="tc-glass rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Access snapshot
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/72 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Session user
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                {authSession.user?.fullName ?? "Admin user"}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {authSession.user?.email ?? "admin@topperschoice.in"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/72 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Registered role templates
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {canReadRoles ? (rolesQuery.data?.length ?? "—") : "Locked"}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {canReadRoles
                  ? `${permissionsQuery.data?.length ?? 0} permission definitions available to future admin assignment flows.`
                  : "This session does not currently expose role registry permissions."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <EmptyState
          eyebrow="Live module"
          title="Pages, banners, announcements, and sections"
          description="The CMS routes are active now, with a shared editor and publish workflow."
          ctaHref="/admin/cms/pages"
          ctaLabel="Manage CMS"
        />
        <EmptyState
          eyebrow="Next module"
          title="Assessment and content authoring"
          description="F11 will extend the same filters, tables, upload flow, and permission rules into structured content, tests, and question bank modules."
        />
        <EmptyState
          eyebrow="Ops note"
          title="Backend remains the source of truth"
          description="The admin shell only mirrors permissions and workflows. All authorization, publishing, and file-asset guarantees stay enforced by the backend contracts."
        />
      </div>
    </div>
  );
}
