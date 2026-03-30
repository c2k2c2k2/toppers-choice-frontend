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

  let shellTitle = authSession.user?.fullName ?? "Student workspace";
  let shellDescription =
    "Use this area to open notes, practice, tests, plans, and updates.";

  if (pathname.startsWith("/student/catalog")) {
    shellTitle = "Catalog";
    shellDescription = "Browse your available tracks, subjects, and topics.";
  } else if (pathname.startsWith("/student/practice")) {
    shellTitle = "Practice";
    shellDescription = "Solve practice questions and review mistakes topic by topic.";
  } else if (pathname.startsWith("/student/tests")) {
    shellTitle = "Tests";
    shellDescription = "Take mock tests, review scores, and track your performance.";
  } else if (pathname.startsWith("/student/plans")) {
    shellTitle = "Plans and access";
    shellDescription = "Check your active plan, payment status, and available access.";
  } else if (
    pathname.startsWith("/student/guidance") ||
    pathname.startsWith("/student/english-speaking") ||
    pathname.startsWith("/student/current-affairs") ||
    pathname.startsWith("/student/monthly-updates")
  ) {
    shellTitle = "Guidance and learning";
    shellDescription = "Open guidance, English speaking, current affairs, and monthly updates.";
  } else if (pathname.startsWith("/student/notes")) {
    shellTitle = "Notes";
    shellDescription = "Read your notes and continue from where you left off.";
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-student)]">
      <div className="mx-auto min-h-dvh w-full px-3 py-3 md:px-4 xl:px-5">
        <div className="tc-student-shell grid min-h-[calc(100dvh-1.5rem)] gap-4 rounded-[34px] p-3 xl:grid-cols-[17.5rem_minmax(0,1fr)] 2xl:grid-cols-[18.5rem_minmax(0,1fr)]">
          <aside className="tc-student-shell-rail hidden rounded-[30px] p-5 xl:sticky xl:top-3 xl:block xl:h-[calc(100dvh-3rem)] xl:overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
                  Student app
                </p>
                <h2 className="tc-display mt-3 text-[1.9rem] font-semibold tracking-tight">
                  Study console
                </h2>
                <p className="tc-muted mt-3 text-sm leading-6">
                  Move across notes, guidance, practice, tests, and plans without losing your study context.
                </p>
              </div>
              <span className="tc-student-chip" data-tone="accent">
                Active
              </span>
            </div>

            <div className="tc-student-card-muted mt-5 rounded-[24px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Study context
              </p>
              <div className="mt-4 grid gap-3">
                <div>
                  <p className="tc-overline">Current track</p>
                  <p className="mt-2 font-semibold text-[color:var(--brand)]">
                    {activeExamTrackCode ?? "Select from dashboard"}
                  </p>
                </div>
                <div>
                  <p className="tc-overline">Current medium</p>
                  <p className="mt-2 font-semibold text-[color:var(--brand)]">
                    {activeMediumCode ?? "Select from dashboard"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="tc-student-chip" data-tone="soft">
                  Shell-wide sync
                </span>
                <span className="tc-student-chip" data-tone="soft">
                  One setup
                </span>
              </div>
            </div>

            <nav className="mt-6">
              <StudentShellNavigation />
            </nav>

            <div className="tc-student-card-muted mt-6 rounded-[24px] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Quick jump
              </p>
              <div className="mt-4 grid gap-3">
                <Link href="/student/notes" className="tc-button-secondary">
                  Resume notes
                </Link>
                <Link href="/student/practice" className="tc-button-secondary">
                  Open practice
                </Link>
              </div>
            </div>
          </aside>

          {isSidebarOpen ? (
            <div className="tc-mobile-sheet xl:hidden">
              <div
                className="absolute inset-0 bg-[rgba(0,30,64,0.24)]"
                onClick={closeSidebar}
              />
              <aside className="tc-student-shell-rail absolute inset-y-4 left-4 w-[min(21rem,calc(100vw-2rem))] rounded-[28px] p-5">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="tc-student-chip" data-tone="soft">
                    {activeExamTrackCode ?? "track pending"}
                  </span>
                  <span className="tc-student-chip" data-tone="soft">
                    {activeMediumCode ?? "medium pending"}
                  </span>
                </div>
                <nav className="mt-5">
                  <StudentShellNavigation compact onNavigate={closeSidebar} />
                </nav>
              </aside>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <header className="tc-student-topbar rounded-[30px] p-5 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="tc-button-secondary xl:hidden"
                    >
                      Menu
                    </button>
                    <p
                      className="tc-kicker"
                      style={{ color: "var(--accent-student)" }}
                    >
                      Current page
                    </p>
                  </div>
                  <h1 className="tc-display mt-3 text-3xl font-semibold tracking-tight md:text-[2.5rem]">
                    {shellTitle}
                  </h1>
                  <p className="tc-muted mt-3 max-w-3xl text-sm leading-7 md:text-base">
                    {shellDescription}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="tc-student-chip">
                      {activeExamTrackCode ?? "track pending"}
                    </span>
                    <span className="tc-student-chip">
                      {activeMediumCode ?? "medium pending"}
                    </span>
                    {authSession.user?.fullName ? (
                      <span className="tc-student-chip" data-tone="soft">
                        {authSession.user.fullName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="tc-admin-toolbar">
                  <div className="tc-student-card-muted rounded-[20px] px-4 py-3 text-sm">
                    <p className="font-semibold text-[color:var(--brand)]">
                      {authSession.user?.email ?? "student@topperschoice.in"}
                    </p>
                    <p className="tc-muted mt-1">
                      Study context stays shared across routes
                    </p>
                  </div>
                  <Link href="/" className="tc-button-secondary">
                    Website
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

            <main className="min-w-0 flex-1 pb-36 xl:pb-0">{children}</main>
          </div>
        </div>
      </div>

      <StudentBottomNavigation />
    </div>
  );
}
