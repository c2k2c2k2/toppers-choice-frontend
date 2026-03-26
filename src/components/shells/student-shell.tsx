"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthSession } from "@/lib/auth";
import {
  StudentBottomNavigation,
  StudentShellNavigation,
} from "@/components/student/student-shell-navigation";
import { useStudentShellStore } from "@/stores";

export function StudentShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeExamTrackCode,
    activeMediumCode,
    closeSidebar,
    isSidebarOpen,
    toggleSidebar,
  } = useStudentShellStore();

  useEffect(() => {
    closeSidebar();
  }, [closeSidebar, pathname]);

  async function handleLogout() {
    await authSession.logout();
    router.replace("/student/login");
  }

  const shellTitle = pathname.startsWith("/student/catalog")
    ? "Catalog workspace"
    : pathname.startsWith("/student/practice")
      ? "Practice workspace"
      : pathname.startsWith("/student/tests")
        ? "Timed test workspace"
    : pathname.startsWith("/student/guidance") ||
        pathname.startsWith("/student/english-speaking") ||
        pathname.startsWith("/student/current-affairs") ||
        pathname.startsWith("/student/monthly-updates")
      ? "Structured learning"
    : pathname.startsWith("/student/notes")
      ? "Notes workspace"
      : authSession.user?.fullName ?? "Student workspace";

  const shellDescription = pathname.startsWith("/student/notes")
    ? "Secure note discovery, preview handling, watermark sessions, and progress tracking live in this student surface."
    : pathname.startsWith("/student/practice")
      ? "Focused practice sessions with weak-area entry points, saved drafts, reveal-aware review, and completion summaries."
      : pathname.startsWith("/student/tests")
        ? "Timed test listings, instruction-led starts, autosaved attempts, countdown safety, and result review now live in the student app."
    : pathname.startsWith("/student/guidance") ||
        pathname.startsWith("/student/english-speaking") ||
        pathname.startsWith("/student/current-affairs") ||
        pathname.startsWith("/student/monthly-updates")
      ? "Reusable structured content lists and detail flows for guidance, English speaking, current affairs, and monthly updates."
    : "Protected app chrome with cross-route track and medium state, ready for the full student product.";

  return (
    <div className="min-h-dvh bg-[color:var(--surface-student)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row">
        <aside className="tc-shell-rail hidden w-80 shrink-0 rounded-[28px] p-5 lg:block">
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Student surface
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Dashboard-first learning shell
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            One mobile-first workspace for catalog discovery, notes, guidance,
            practice, tests, and payments.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Current track</p>
              <p className="mt-2 font-semibold text-[color:var(--brand)]">
                {activeExamTrackCode ?? "Select from dashboard"}
              </p>
            </div>
            <div className="tc-card rounded-[22px] p-4">
              <p className="tc-overline">Current medium</p>
              <p className="mt-2 font-semibold text-[color:var(--brand)]">
                {activeMediumCode ?? "Select from dashboard"}
              </p>
            </div>
          </div>

          <nav className="mt-6">
            <StudentShellNavigation />
          </nav>
        </aside>

        {isSidebarOpen ? (
          <div className="tc-mobile-sheet lg:hidden">
            <div
              className="absolute inset-0 bg-[rgba(0,30,64,0.24)]"
              onClick={closeSidebar}
            />
            <aside className="tc-shell-rail absolute inset-y-4 left-4 w-[min(20rem,calc(100vw-2rem))] rounded-[28px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="tc-kicker"
                    style={{ color: "var(--accent-student)" }}
                  >
                    Student app
                  </p>
                  <h2 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                    Navigation
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSidebar}
                  className="tc-button-secondary"
                >
                  Close
                </button>
              </div>
              <nav className="mt-5">
                <StudentShellNavigation compact onNavigate={closeSidebar} />
              </nav>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="tc-glass rounded-[28px] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="tc-button-secondary lg:hidden"
                  >
                    Menu
                  </button>
                  <p
                    className="tc-kicker"
                    style={{ color: "var(--accent-student)" }}
                  >
                    Shared student layout
                  </p>
                </div>
                <h1 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  {shellTitle}
                </h1>
                <p className="tc-muted mt-2 text-sm leading-6">
                  {shellDescription}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="tc-panel rounded-[20px] px-4 py-3 text-sm">
                  <p className="font-semibold text-[color:var(--brand)]">
                    {authSession.user?.email ?? "student@topperschoice.in"}
                  </p>
                  <p className="tc-muted mt-1">
                    {activeExamTrackCode ?? "track pending"} ·{" "}
                    {activeMediumCode ?? "medium pending"}
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

          <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        </div>
      </div>

      <StudentBottomNavigation />
    </div>
  );
}
