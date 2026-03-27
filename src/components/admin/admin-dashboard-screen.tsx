"use client";

import Link from "next/link";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { adminQueryKeys } from "@/lib/api/query-keys";
import {
  getAdminContentHealth,
  getAdminOpsDashboard,
} from "@/lib/admin";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

const MANAGEMENT_AREAS = [
  {
    href: "/admin/cms/pages",
    label: "Website content",
    description: "Update banners, announcements, pages, and home sections.",
    permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
  },
  {
    href: "/admin/notes",
    label: "Learning content",
    description: "Manage notes and structured learning content.",
    permissions: [
      "content.notes.read",
      "content.notes.manage",
      "content.structured.read",
      "content.structured.manage",
    ],
  },
  {
    href: "/admin/questions",
    label: "Questions and tests",
    description: "Maintain the question bank and publish mock tests.",
    permissions: [
      "academics.questions.read",
      "academics.questions.manage",
      "academics.tests.read",
      "academics.tests.manage",
    ],
  },
  {
    href: "/admin/plans",
    label: "Plans and payments",
    description: "Review pricing, active subscriptions, and payment orders.",
    permissions: ["payments.read", "payments.manage"],
  },
  {
    href: "/admin/users",
    label: "Users and access",
    description: "Support students, admins, roles, and entitlements.",
    permissions: [
      "admin.users.read",
      "admin.users.manage",
      "admin.roles.read",
      "admin.roles.manage",
    ],
  },
  {
    href: "/admin/analytics",
    label: "Reports and operations",
    description: "Open analytics, notifications, search, and health checks.",
    permissions: ["analytics.read", "admin.ops.read", "notifications.read"],
  },
] as const;

export function AdminDashboardScreen() {
  const authSession = useAuthSession();
  const canReadOps = authSession.hasPermission("admin.ops.read");

  const dashboardQuery = useAuthenticatedQuery({
    enabled: canReadOps,
    queryFn: getAdminOpsDashboard,
    queryKey: adminQueryKeys.dashboard(),
    staleTime: 30_000,
  });
  const contentHealthQuery = useAuthenticatedQuery({
    enabled: canReadOps,
    queryFn: getAdminContentHealth,
    queryKey: adminQueryKeys.contentHealth(),
    staleTime: 30_000,
  });

  const hasBlockingError =
    canReadOps && (dashboardQuery.error || contentHealthQuery.error);

  if (canReadOps && (dashboardQuery.isLoading || contentHealthQuery.isLoading)) {
    return (
      <LoadingState
        title="Loading dashboard"
        description="Fetching the latest admin summary and launch checks."
      />
    );
  }

  if (hasBlockingError) {
    return (
      <ErrorState
        title="The admin dashboard could not be loaded."
        description="We couldn't load the latest summary for this admin account."
        onRetry={() => {
          void dashboardQuery.refetch();
          void contentHealthQuery.refetch();
        }}
      />
    );
  }

  const launchItems = [
    {
      count:
        (contentHealthQuery.data?.cmsDraftPages ?? 0) +
        (contentHealthQuery.data?.cmsDraftSections ?? 0),
      description: "Website pages and home sections that still need review before launch.",
      href: "/admin/cms/pages",
      label: "Website drafts",
    },
    {
      count:
        (contentHealthQuery.data?.draftNotes ?? 0) +
        (contentHealthQuery.data?.draftStructuredContent ?? 0),
      description: "Learning content that is saved but not yet ready for students.",
      href: "/admin/notes",
      label: "Content drafts",
    },
    {
      count:
        (contentHealthQuery.data?.draftQuestions ?? 0) +
        (contentHealthQuery.data?.draftTests ?? 0),
      description: "Assessment items that still need a final review or publish step.",
      href: "/admin/questions",
      label: "Assessment drafts",
    },
    {
      count: contentHealthQuery.data?.pendingFileUploads ?? 0,
      description: "Files that were started but not fully uploaded or confirmed.",
      href: "/admin/cms/pages",
      label: "Pending uploads",
    },
  ];
  const launchIssues = launchItems.filter((item) => item.count > 0);
  const visibleAreas = MANAGEMENT_AREAS.filter((area) =>
    area.permissions.some((permission) => authSession.hasPermission(permission)),
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Admin dashboard"
        title="Manage Topper's Choice from one place."
        description="Use this page to check what needs attention, open the right workspace, and review launch readiness without digging through the full app."
        actions={
          <>
            <Link href="/admin/cms/pages" className="tc-button-primary">
              Website content
            </Link>
            <Link href="/admin/users" className="tc-button-secondary">
              Users and access
            </Link>
          </>
        }
      />

      {canReadOps ? (
        launchIssues.length > 0 ? (
          <AdminInlineNotice tone="warning">
            Review these items before deployment:{" "}
            {launchIssues
              .map((item) => `${item.count} ${item.label.toLowerCase()}`)
              .join(", ")}
            .
          </AdminInlineNotice>
        ) : (
          <AdminInlineNotice tone="success">
            No website drafts, content drafts, assessment drafts, or pending uploads were found in the launch summary.
          </AdminInlineNotice>
        )
      ) : (
        <AdminInlineNotice>
          This login can still use the admin panel, but the launch summary is hidden because this account does not have operations-report access.
        </AdminInlineNotice>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Students"
          value={canReadOps ? dashboardQuery.data?.users.students ?? "—" : "Locked"}
          detail="Students currently present in the system."
        />
        <AdminMetricCard
          label="Admins"
          value={canReadOps ? dashboardQuery.data?.users.admins ?? "—" : "Locked"}
          detail="Admins who can access internal tools."
        />
        <AdminMetricCard
          label="Active subscriptions"
          value={canReadOps ? dashboardQuery.data?.commercial.activeSubscriptions ?? "—" : "Locked"}
          detail="Students with an active paid plan."
        />
        <AdminMetricCard
          label="Pending uploads"
          value={canReadOps ? dashboardQuery.data?.operational.pendingUploads ?? "—" : "Locked"}
          detail="Files that need attention before they appear correctly."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="tc-card rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Start here
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {visibleAreas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="tc-panel rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  {area.label}
                </h2>
                <p className="tc-muted mt-3 text-sm leading-6">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="tc-glass rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            This login
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
                Assigned roles
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                {authSession.access?.roles.map((role) => role.name).join(", ") || "No roles assigned"}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                If a menu item is missing, this account does not have permission to use that part of the admin panel yet.
              </p>
            </div>
            <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/72 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Menu access
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {authSession.access?.effectivePermissionKeys.length ?? 0}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Effective permissions currently available to this login.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="tc-card rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Launch review
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Check the items most likely to block deployment.
            </h2>
          </div>
          <Link href="/student" className="tc-button-secondary">
            Open student app
          </Link>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {launchItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="tc-panel rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                  {item.label}
                </h3>
                <span className="tc-code-chip">{canReadOps ? item.count : "Locked"}</span>
              </div>
              <p className="tc-muted mt-3 text-sm leading-6">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
