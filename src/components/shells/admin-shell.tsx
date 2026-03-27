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

  async function handleLogout() {
    await authSession.logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-admin)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[96rem] flex-col gap-4 px-4 py-4 xl:flex-row">
        <aside className="tc-shell-rail w-full rounded-[32px] p-5 xl:sticky xl:top-4 xl:h-[calc(100dvh-2rem)] xl:w-[22rem] xl:shrink-0 xl:overflow-y-auto">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Topper&apos;s Choice
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Admin panel
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            Use this panel to manage website content, learning material, students, plans, and day-to-day operations.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <div className="tc-panel rounded-[22px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Session
              </p>
              <p className="mt-3 font-semibold text-[color:var(--brand)]">
                {authSession.user?.fullName ?? "Admin workspace"}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {authSession.user?.email ?? "admin@topperschoice.in"}
              </p>
            </div>
            <div className="tc-panel rounded-[22px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Roles
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {authSession.access?.roles.length ?? 0}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {authSession.access?.roles.map((role) => role.name).join(", ") || "No roles assigned"}
              </p>
            </div>
            <div className="tc-panel rounded-[22px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Permissions
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--brand)]">
                {authSession.access?.effectivePermissionKeys.length ?? 0}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Menu items change based on these permissions.
              </p>
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
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="tc-glass rounded-[32px] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Current section
                </p>
                <h1 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                  {currentRoute.title}
                </h1>
                <p className="tc-muted mt-2 text-sm leading-6">
                  {currentRoute.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
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

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
