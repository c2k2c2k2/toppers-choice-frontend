"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuthSession } from "@/lib/auth";

interface AdminNavItem {
  badge?: string;
  description: string;
  href?: string;
  label: string;
  permissions?: string[];
}

const ADMIN_NAV_GROUPS: Array<{
  items: AdminNavItem[];
  title: string;
}> = [
  {
    title: "Workspace",
    items: [
      {
        href: "/admin",
        label: "Overview",
        description: "Quick summary, launch checks, and shortcuts into the main admin sections.",
      },
    ],
  },
  {
    title: "Website and Content",
    items: [
      {
        href: "/admin/taxonomy",
        label: "Taxonomy",
        description: "Tracks, mediums, subjects, topics, and tags.",
        permissions: ["academics.taxonomy.read", "academics.taxonomy.manage"],
      },
      {
        href: "/admin/notes",
        label: "Notes",
        description: "Create, update, and publish note records.",
        permissions: ["content.notes.read", "content.notes.manage", "content.notes.publish"],
      },
      {
        href: "/admin/content",
        label: "Structured content",
        description: "Guidance, English speaking, current affairs, and monthly updates.",
        permissions: [
          "content.structured.read",
          "content.structured.manage",
          "content.structured.publish",
        ],
      },
      {
        href: "/admin/questions",
        label: "Questions",
        description: "Question bank, options, answers, and media.",
        permissions: [
          "academics.questions.read",
          "academics.questions.manage",
          "academics.questions.publish",
        ],
      },
      {
        href: "/admin/tests",
        label: "Tests",
        description: "Create mock tests and manage publish status.",
        permissions: ["academics.tests.read", "academics.tests.manage", "academics.tests.publish"],
      },
      {
        href: "/admin/cms/pages",
        label: "Pages",
        description: "About, contact, policy, and other website pages.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/banners",
        label: "Banners",
        description: "Homepage and promotional banners.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/announcements",
        label: "Announcements",
        description: "Short notices for the website and student app.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/sections",
        label: "Home sections",
        description: "Homepage blocks and their display order.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
    ],
  },
  {
    title: "Commerce",
    items: [
      {
        href: "/admin/plans",
        label: "Plans",
        description: "Plan names, pricing, duration, and included access.",
        permissions: ["payments.read", "payments.manage"],
      },
      {
        href: "/admin/payments",
        label: "Payments",
        description: "Orders, payment status, and manual checks.",
        permissions: ["payments.read", "payments.manage"],
      },
    ],
  },
  {
    title: "People and Reach",
    items: [
      {
        href: "/admin/users",
        label: "Users and access",
        description: "Students, admins, roles, permissions, and entitlements.",
        permissions: [
          "admin.users.read",
          "admin.users.manage",
          "admin.users.roles.read",
          "admin.users.roles.manage",
          "admin.roles.read",
          "admin.roles.manage",
        ],
      },
      {
        href: "/admin/audit",
        label: "Audit",
        description: "See who changed what and when.",
        permissions: ["admin.audit.read"],
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        description: "Templates, broadcasts, and delivery status.",
        permissions: ["notifications.read", "notifications.manage", "notifications.send"],
      },
    ],
  },
  {
    title: "Reports and Ops",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Student, content, revenue, and activity reports.",
        permissions: ["analytics.read"],
      },
      {
        href: "/admin/ops",
        label: "Operations",
        description: "Search, content health, exports, and security checks.",
        permissions: [
          "admin.search.read",
          "admin.ops.read",
          "admin.ops.export",
          "admin.ops.support",
          "admin.security.read",
        ],
      },
    ],
  },
];

function isActive(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getRouteCopy(
  pathname: string,
  navGroups: Array<{
    items: AdminNavItem[];
    title: string;
  }>,
) {
  if (pathname === "/admin") {
    return {
      title: "Admin dashboard",
      description: "Review important counts, check launch items, and open the right workspace quickly.",
    };
  }

  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href && isActive(pathname, item.href)) {
        return {
          title: item.label,
          description: item.description,
        };
      }
    }
  }

  return {
    title: "Admin panel",
    description: "Manage the application from the sections available to this account.",
  };
}

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  const navGroups = useMemo(() => {
    return ADMIN_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permissions || item.permissions.length === 0) {
          return true;
        }

        return item.permissions.some((permission) => authSession.hasPermission(permission));
      }),
    })).filter((group) => group.items.length > 0);
  }, [authSession]);
  const currentRoute = getRouteCopy(pathname, navGroups);
  const roleCount = authSession.access?.roles.length ?? 0;
  const permissionCount = authSession.access?.effectivePermissionKeys.length ?? 0;
  const visibleSectionCount = navGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );

  async function handleLogout() {
    await authSession.logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-admin)]">
      <div className="mx-auto min-h-dvh w-full px-3 py-3 md:px-4 xl:px-5">
        <div className="grid min-h-[calc(100dvh-1.5rem)] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] 2xl:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="tc-shell-rail flex w-full flex-col rounded-[30px] p-5 xl:sticky xl:top-3 xl:h-[calc(100dvh-1.5rem)] xl:overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Topper&apos;s Choice
                </p>
                <h2 className="tc-display mt-3 text-[1.85rem] font-semibold tracking-tight">
                  Admin workspace
                </h2>
                <p className="tc-muted mt-3 text-sm leading-6">
                  Manage content, academics, commerce, and operations from one calmer control room.
                </p>
              </div>
              <span className="tc-admin-chip" data-tone="brand">
                Live
              </span>
            </div>

            <div className="tc-admin-frame-subtle mt-5 rounded-[24px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Signed in
              </p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
                {authSession.user?.fullName ?? "Admin workspace"}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {authSession.user?.email ?? "admin@topperschoice.in"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="tc-admin-chip">{roleCount} roles</span>
                <span className="tc-admin-chip">{permissionCount} permissions</span>
                <span className="tc-admin-chip" data-tone="subtle">
                  {visibleSectionCount} sections
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    {group.title}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {group.items.map((item) =>
                      item.href ? (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="tc-rail-link flex-col items-start"
                          data-active={isActive(pathname, item.href)}
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="font-semibold">{item.label}</span>
                            {item.badge ? (
                              <span className="tc-nav-badge" data-status="live">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs leading-5 text-[color:var(--muted)]">
                            {item.description}
                          </span>
                        </Link>
                      ) : (
                        <div
                          key={item.label}
                          className="tc-rail-link flex-col items-start"
                          data-disabled="true"
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="font-semibold">{item.label}</span>
                            {item.badge ? (
                              <span className="tc-nav-badge" data-status="soon">
                                {item.badge}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs leading-5 text-[color:var(--muted)]">
                            {item.description}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="tc-admin-frame-subtle mt-6 rounded-[24px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Quick launch
              </p>
              <div className="mt-4 grid gap-3">
                <Link href="/" className="tc-button-secondary">
                  Open website
                </Link>
                <Link href="/student" className="tc-button-secondary">
                  Open student app
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <header className="tc-admin-topbar rounded-[30px] p-5 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                    Current section
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="tc-display text-3xl font-semibold tracking-tight md:text-[2.5rem]">
                      {currentRoute.title}
                    </h1>
                    <span className="tc-admin-chip" data-tone="accent">
                      {visibleSectionCount} sections available
                    </span>
                  </div>
                  <p className="tc-muted mt-3 text-sm leading-7 md:text-base">
                    {currentRoute.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="tc-admin-chip">{roleCount} roles</span>
                    <span className="tc-admin-chip">{permissionCount} permissions</span>
                    {authSession.user?.email ? (
                      <span className="tc-admin-chip" data-tone="subtle">
                        {authSession.user.email}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="tc-admin-toolbar">
                  <Link href="/" className="tc-button-secondary">
                    Website
                  </Link>
                  <Link href="/student" className="tc-button-secondary">
                    Student app
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="tc-button-primary"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </header>

            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
