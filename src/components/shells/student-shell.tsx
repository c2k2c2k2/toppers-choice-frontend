"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/primitives/brand-logo";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { getCurrentEntitlements, isActiveEntitlement } from "@/lib/payments";
import {
  buildStudentCatalogSnapshot,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import {
  heartbeatTrial,
  startTrial,
  stopTrial,
  type TrialAccess,
} from "@/lib/trial";
import {
  StudentBottomNavigation,
  StudentShellNavigation,
} from "@/components/student/student-shell-navigation";
import { useStudentShellStore } from "@/stores";

const trialStartRequests = new Map<string, Promise<TrialAccess>>();

function startTrialOnce(accessToken: string) {
  const pendingRequest = trialStartRequests.get(accessToken);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = startTrial(accessToken).finally(() => {
    trialStartRequests.delete(accessToken);
  });

  trialStartRequests.set(accessToken, request);
  return request;
}

export function StudentShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const [trialAccess, setTrialAccess] = useState<TrialAccess | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const ensureAccessTokenRef = useRef(authSession.ensureAccessToken);
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeExamTrackCode,
    activeMediumCode,
    closeSidebar,
    isDesktopSidebarCollapsed,
    isSidebarOpen,
    setActiveExamTrackCode,
    setActiveMediumCode,
    toggleDesktopSidebar,
    toggleSidebar,
  } = useStudentShellStore();
  const entitlementsQuery = useAuthenticatedQuery({
    enabled:
      authSession.isReady &&
      authSession.isAuthenticated &&
      authSession.user?.userType === "STUDENT",
    queryFn: getCurrentEntitlements,
    queryKey: queryKeys.student.entitlements(),
    staleTime: 15_000,
  });
  const catalogQuery = useAuthenticatedQuery({
    enabled:
      authSession.isReady &&
      authSession.isAuthenticated &&
      authSession.user?.userType === "STUDENT",
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const catalogSnapshot = catalogQuery.data
    ? buildStudentCatalogSnapshot(catalogQuery.data, {
        examTrackCode: activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;

  const hasActiveEntitlement =
    entitlementsQuery.data?.items.some((entitlement) =>
      isActiveEntitlement(entitlement),
    ) ?? false;
  const entitlementsReady =
    entitlementsQuery.isFetched || entitlementsQuery.isError;

  useEffect(() => {
    closeSidebar();
  }, [closeSidebar, pathname]);

  useEffect(() => {
    ensureAccessTokenRef.current = authSession.ensureAccessToken;
  }, [authSession.ensureAccessToken]);

  useEffect(() => {
    let cancelled = false;
    let shouldStopTrialOnCleanup = false;

    function clearHeartbeat() {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    async function callTrialEndpoint(
      endpoint: (accessToken: string) => Promise<TrialAccess>,
    ) {
      const accessToken = await ensureAccessTokenRef.current();

      if (!accessToken || cancelled) {
        return null;
      }

      const nextTrial = await endpoint(accessToken);

      if (!cancelled) {
        setTrialAccess(nextTrial);
      }

      return nextTrial;
    }

    async function startHeartbeatLoop() {
      if (
        !authSession.isReady ||
        !authSession.isAuthenticated ||
        authSession.user?.userType !== "STUDENT" ||
        !entitlementsReady ||
        hasActiveEntitlement
      ) {
        return;
      }

      try {
        const startedTrial = await callTrialEndpoint(startTrialOnce);
        shouldStopTrialOnCleanup = Boolean(startedTrial?.id);

        clearHeartbeat();

        if (!startedTrial?.enabled || !startedTrial.hasAccess) {
          return;
        }

        heartbeatIntervalRef.current = setInterval(() => {
          if (document.visibilityState !== "visible") {
            return;
          }

          void callTrialEndpoint(heartbeatTrial).catch(() => undefined);
        }, Math.max(10, startedTrial.policy.heartbeatSeconds) * 1000);
      } catch {
        clearHeartbeat();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        clearHeartbeat();
        void callTrialEndpoint(stopTrial).catch(() => undefined);
        return;
      }

      void startHeartbeatLoop();
    }

    void startHeartbeatLoop();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (
        authSession.isAuthenticated &&
        authSession.user?.userType === "STUDENT" &&
        shouldStopTrialOnCleanup
      ) {
        void ensureAccessTokenRef.current().then((accessToken) =>
          accessToken ? stopTrial(accessToken).catch(() => undefined) : null,
        );
      }
    };
  }, [
    authSession.isAuthenticated,
    authSession.isReady,
    authSession.user?.userType,
    entitlementsReady,
    hasActiveEntitlement,
  ]);

  useEffect(() => {
    if (
      !hasActiveEntitlement ||
      !authSession.isAuthenticated ||
      authSession.user?.userType !== "STUDENT"
    ) {
      return;
    }

    if (!trialAccess?.id) {
      return;
    }

    setTrialAccess(null);
    void ensureAccessTokenRef.current().then((accessToken) =>
      accessToken ? stopTrial(accessToken).catch(() => undefined) : null,
    );
  }, [
    authSession.isAuthenticated,
    authSession.user?.userType,
    hasActiveEntitlement,
    trialAccess?.id,
  ]);

  useEffect(() => {
    if (!catalogSnapshot?.selectedTrack?.code) {
      return;
    }

    if (!activeExamTrackCode || activeExamTrackCode !== catalogSnapshot.selectedTrack.code) {
      setActiveExamTrackCode(catalogSnapshot.selectedTrack.code);
    }
  }, [
    activeExamTrackCode,
    catalogSnapshot?.selectedTrack?.code,
    setActiveExamTrackCode,
  ]);

  useEffect(() => {
    if (!catalogSnapshot?.selectedMedium?.code) {
      return;
    }

    if (!activeMediumCode || activeMediumCode !== catalogSnapshot.selectedMedium.code) {
      setActiveMediumCode(catalogSnapshot.selectedMedium.code);
    }
  }, [
    activeMediumCode,
    catalogSnapshot?.selectedMedium?.code,
    setActiveMediumCode,
  ]);

  async function handleLogout() {
    const accessToken = await authSession.ensureAccessToken();
    if (accessToken) {
      await stopTrial(accessToken).catch(() => undefined);
    }
    await authSession.logout();
    router.replace("/student/login");
  }

  const trialRemainingLabel = trialAccess
    ? formatTrialDuration(trialAccess.remainingSeconds)
    : "20 min";
  const trialChipLabel =
    trialAccess && !trialAccess.enabled
      ? "Trial paused"
      : trialAccess?.hasAccess === false
        ? "Trial ended"
        : `${trialRemainingLabel} trial left`;
  const accessChipLabel = hasActiveEntitlement
    ? "Premium active"
    : entitlementsReady
      ? trialChipLabel
      : "Checking access";
  const welcomeName =
    authSession.user?.fullName?.trim() ||
    authSession.user?.email?.split("@")[0] ||
    "Student";

  let shellTitle = "Dashboard";

  if (pathname.startsWith("/student/catalog")) {
    shellTitle = "Catalog";
  } else if (pathname.startsWith("/student/english-speaking")) {
    shellTitle = "English speaking";
  } else if (pathname.startsWith("/student/practice")) {
    shellTitle = "Practice";
  } else if (pathname.startsWith("/student/tests")) {
    shellTitle = "Tests";
  } else if (pathname.startsWith("/student/plans")) {
    shellTitle = "Plans";
  } else if (
    pathname.startsWith("/student/guidance") ||
    pathname.startsWith("/student/current-affairs") ||
    pathname.startsWith("/student/monthly-updates")
  ) {
    shellTitle = "Guidance";
  } else if (pathname.startsWith("/student/notes")) {
    shellTitle = "Notes";
  }

  const shellGridClass = isDesktopSidebarCollapsed
    ? "tc-student-shell grid min-h-[calc(100dvh-1rem)] gap-3 rounded-[20px] p-2 xl:grid-cols-[4.5rem_minmax(0,1fr)]"
    : "tc-student-shell grid min-h-[calc(100dvh-1rem)] gap-3 rounded-[20px] p-2 xl:grid-cols-[12.5rem_minmax(0,1fr)] 2xl:grid-cols-[13.5rem_minmax(0,1fr)]";
  const menuButton = (
    <button
      type="button"
      onClick={toggleDesktopSidebar}
      className="tc-student-menu-button hidden xl:inline-flex"
      aria-label={isDesktopSidebarCollapsed ? "Expand menu" : "Collapse menu"}
      title={isDesktopSidebarCollapsed ? "Expand menu" : "Collapse menu"}
    >
      <HamburgerIcon />
    </button>
  );

  return (
    <div className="min-h-dvh bg-[color:var(--surface-student)]">
      <div className="mx-auto min-h-dvh w-full px-2 py-2 md:px-3 xl:px-4">
        <div className={shellGridClass}>
          <aside
            className="tc-student-shell-rail hidden rounded-[18px] p-3 xl:sticky xl:top-2 xl:block xl:h-[calc(100dvh-2rem)] xl:overflow-y-auto"
            data-collapsed={isDesktopSidebarCollapsed}
          >
            <div
              className={`flex items-center gap-3 ${
                isDesktopSidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="inline-flex rounded-[16px] border border-white/70 bg-white/82 p-2 shadow-[0_12px_24px_rgba(0,30,64,0.1)]">
                <BrandMark alt="" priority sizes="42px" className="w-10" />
              </div>
              <div className={isDesktopSidebarCollapsed ? "sr-only" : "min-w-0"}>
                <p className="text-sm font-extrabold text-[color:var(--brand)]">
                  Toppers&apos; Choice
                </p>
                <p className="tc-muted mt-0.5 text-xs">Student app</p>
              </div>
            </div>

            <nav className="mt-4">
              <StudentShellNavigation iconOnly={isDesktopSidebarCollapsed} />
            </nav>

            <div
              className={`mt-4 flex flex-wrap gap-2 ${
                isDesktopSidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <span className="tc-student-chip" data-tone="accent">
                {isDesktopSidebarCollapsed ? "P" : accessChipLabel}
              </span>
            </div>
          </aside>

          {isSidebarOpen ? (
            <div className="tc-mobile-sheet xl:hidden">
              <div
                className="absolute inset-0 bg-[rgba(0,30,64,0.24)]"
                onClick={closeSidebar}
              />
              <aside className="tc-student-shell-rail absolute inset-y-3 left-3 w-[min(20rem,calc(100vw-1.5rem))] rounded-[22px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BrandMark alt="" sizes="40px" className="w-10" />
                    <p className="font-bold text-[color:var(--brand)]">Menu</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="tc-button-secondary"
                  >
                    Close
                  </button>
                </div>
                <nav className="mt-4">
                  <StudentShellNavigation compact onNavigate={closeSidebar} />
                </nav>
              </aside>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <header className="tc-student-topbar rounded-[18px] px-3 py-2 md:px-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="tc-student-menu-button xl:hidden"
                    aria-label="Open menu"
                  >
                    <HamburgerIcon />
                  </button>
                  {menuButton}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--muted)]">
                      Welcome, {welcomeName}
                    </p>
                    <h1 className="truncate text-lg font-semibold text-[color:var(--brand)] md:text-xl">
                      {shellTitle}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <label className="tc-student-track-select">
                    <span className="sr-only">Exam track</span>
                    <select
                      value={catalogSnapshot?.selectedTrack?.code ?? ""}
                      onChange={(event) => {
                        setActiveExamTrackCode(event.target.value);
                      }}
                      disabled={!catalogQuery.data?.examTracks.length}
                    >
                      {catalogQuery.data?.examTracks.length ? (
                        catalogQuery.data.examTracks.map((examTrack) => (
                          <option key={examTrack.id} value={examTrack.code}>
                            {getTrackLabel(examTrack)}
                          </option>
                        ))
                      ) : (
                        <option value="">Track</option>
                      )}
                    </select>
                  </label>
                  <span className="tc-student-chip hidden sm:inline-flex" data-tone="accent">
                    {accessChipLabel}
                  </span>
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

            <main className="min-w-0 flex-1 pb-24 xl:pb-0">{children}</main>
          </div>
        </div>
      </div>

      <StudentBottomNavigation />
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function formatTrialDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
