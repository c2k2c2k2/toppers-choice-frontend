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
        description: "Bootstrap metrics, session roles, and the shared admin foundation.",
      },
      {
        href: "/admin/cms/pages",
        label: "Pages",
        description: "Public and internal page records for stitched routes.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/banners",
        label: "Banners",
        description: "Hero and promotion banners for landing and student surfaces.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/announcements",
        label: "Announcements",
        description: "Pinned alerts, campaign notices, and timed messaging.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
      {
        href: "/admin/cms/sections",
        label: "Sections",
        description: "Home-page section compositions aligned to stitch-led surfaces.",
        permissions: ["content.cms.read", "content.cms.manage", "content.cms.publish"],
      },
    ],
  },
  {
    title: "Next Up",
    items: [
      {
        label: "Content authoring",
        description: "Structured content, notes, and media-heavy flows arrive in F11.",
        badge: "F11",
      },
      {
        label: "Assessments",
        description: "Question bank, practice, and tests will reuse this CRUD shell next.",
        badge: "F11",
      },
      {
        label: "Users and ops",
        description: "People management, exports, analytics, and operational tools follow.",
        badge: "F11",
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

  async function handleLogout() {
    await authSession.logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-admin)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[96rem] flex-col gap-4 px-4 py-4 xl:flex-row">
        <aside className="tc-shell-rail w-full rounded-[32px] p-5 xl:sticky xl:top-4 xl:h-[calc(100dvh-2rem)] xl:w-[22rem] xl:shrink-0 xl:overflow-y-auto">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Topper&apos;s Choice admin
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Shared internal workspace
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            Permission-aware navigation, shared CRUD foundations, and backend-driven publish flows now anchor the admin surface.
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
                {authSession.access?.roles.map((role) => role.name).join(", ") || "No roles"}
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
                Frontend gates mirror the backend access graph.
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
                  Current route
                </p>
                <h1 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                  {pathname === "/admin" ? "Admin overview" : pathname.replace(/^\/admin\//, "Admin / ")}
                </h1>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Protected by shared auth bootstrap, with route-level permission guards layered on top for CMS and later admin modules.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="tc-button-secondary">
                  Public site
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
