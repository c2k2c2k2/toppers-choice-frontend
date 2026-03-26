"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth";

const adminLinks = [
  { href: "/admin", label: "Users and access" },
  { href: "/admin", label: "Content and CMS" },
  { href: "/admin", label: "Assessments" },
  { href: "/admin", label: "Analytics and ops" },
] as const;

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authSession.logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-admin)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 px-4 py-4 xl:flex-row">
        <aside className="tc-shell-rail w-full rounded-[28px] p-5 xl:w-80 xl:shrink-0">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Admin surface
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Permission-ready shell
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            Shared structure for admin dashboards, CRUD modules, CMS,
            analytics, and operational tooling with the same tonal card system
            as the public and student surfaces.
          </p>
          <nav className="mt-6 flex flex-col gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="tc-rail-link"
                data-active={pathname === link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="tc-glass rounded-[28px] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Shared admin layout
                </p>
                <h1 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                  {authSession.user?.fullName ?? "Admin workspace"}
                </h1>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Backend permissions remain the contract source of truth. This
                  shell now renders only after the shared auth session layer has
                  restored and validated the current admin session.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="tc-panel rounded-[20px] px-4 py-3 text-sm">
                  <p className="font-semibold text-[color:var(--brand)]">
                    {authSession.user?.email ?? "admin@topperschoice.in"}
                  </p>
                  <p className="tc-muted mt-1">
                    {authSession.access?.effectivePermissionKeys.length ?? 0} permissions
                  </p>
                </div>
                <Link href="/" className="tc-button-secondary">
                  Back to public home
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
