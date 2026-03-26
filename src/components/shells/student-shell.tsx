"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/auth";

const studentLinks = [
  { href: "/student", label: "Dashboard shell" },
  { href: "/student", label: "Notes placeholder" },
  { href: "/student", label: "Practice placeholder" },
  { href: "/student", label: "Tests placeholder" },
] as const;

export function StudentShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authSession.logout();
    router.replace("/student/login");
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-student)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row">
        <aside className="tc-shell-rail w-full rounded-[28px] p-5 lg:w-72 lg:shrink-0">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Student surface
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Install-ready shell
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            Shared chrome for dashboard, notes, practice, tests, and payments
            with the dashboard cadence from the stitch references.
          </p>
          <nav className="mt-6 flex flex-col gap-2">
            {studentLinks.map((link) => (
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
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Shared student layout
                </p>
                <h1 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                  {authSession.user?.fullName ?? "Student workspace"}
                </h1>
                <p className="tc-muted mt-2 text-sm leading-6">
                  The shared auth provider now restores the session before this
                  shell renders protected student content.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="tc-panel rounded-[20px] px-4 py-3 text-sm">
                  <p className="font-semibold text-[color:var(--brand)]">
                    {authSession.user?.email ?? "student@topperschoice.in"}
                  </p>
                  <p className="tc-muted mt-1">
                    Session {authSession.sessionId ? "active" : "not ready"}
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
