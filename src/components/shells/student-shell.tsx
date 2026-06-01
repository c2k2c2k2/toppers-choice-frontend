"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/primitives/brand-logo";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { getCurrentEntitlements, isActiveEntitlement } from "@/lib/payments";
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
    isSidebarOpen,
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

  const currentTrackLabel = activeExamTrackCode ?? "Track not set";
  const currentMediumLabel = activeMediumCode ?? "Medium not set";
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

  let shellTitle = authSession.user?.fullName ?? "Student workspace";
  let shellDescription = "Notes, practice, tests, and updates.";

  if (pathname.startsWith("/student/catalog")) {
    shellTitle = "Catalog";
    shellDescription = "Browse tracks, subjects, and topics.";
  } else if (pathname.startsWith("/student/english-speaking")) {
    shellTitle = "English speaking";
    shellDescription = "Listen and repeat topic-wise sentences.";
  } else if (pathname.startsWith("/student/practice")) {
    shellTitle = "Practice";
    shellDescription = "Solve questions and review mistakes.";
  } else if (pathname.startsWith("/student/tests")) {
    shellTitle = "Tests";
    shellDescription = "Take tests and review scores.";
  } else if (pathname.startsWith("/student/plans")) {
    shellTitle = "Plans and access";
    shellDescription = "Check plan and payment access.";
  } else if (
    pathname.startsWith("/student/guidance") ||
    pathname.startsWith("/student/current-affairs") ||
    pathname.startsWith("/student/monthly-updates")
  ) {
    shellTitle = "Guidance and learning";
    shellDescription = "Guidance, current affairs, and updates.";
  } else if (pathname.startsWith("/student/notes")) {
    shellTitle = "Notes";
    shellDescription = "Read notes and continue studying.";
  }

  return (
    <div className="min-h-dvh bg-[color:var(--surface-student)]">
      <div className="mx-auto min-h-dvh w-full px-2 py-2 md:px-3 xl:px-4">
        <div className="tc-student-shell grid min-h-[calc(100dvh-1rem)] gap-3 rounded-[24px] p-2 xl:grid-cols-[14.5rem_minmax(0,1fr)] 2xl:grid-cols-[15.5rem_minmax(0,1fr)]">
          <aside className="tc-student-shell-rail hidden rounded-[20px] p-3 xl:sticky xl:top-2 xl:block xl:h-[calc(100dvh-2rem)] xl:overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-[16px] border border-white/70 bg-white/82 p-2 shadow-[0_12px_24px_rgba(0,30,64,0.1)]">
                <BrandMark alt="" priority sizes="42px" className="w-10" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[color:var(--brand)]">
                  Toppers&apos; Choice
                </p>
                <p className="tc-muted mt-0.5 text-xs">Student app</p>
              </div>
            </div>

            <nav className="mt-4">
              <StudentShellNavigation />
            </nav>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tc-student-chip" data-tone="soft">
                {currentTrackLabel}
              </span>
              <span className="tc-student-chip" data-tone="accent">
                {accessChipLabel}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="tc-student-chip" data-tone="soft">
                    {currentTrackLabel}
                  </span>
                  <span className="tc-student-chip" data-tone="soft">
                    {currentMediumLabel}
                  </span>
                </div>
                <nav className="mt-4">
                  <StudentShellNavigation compact onNavigate={closeSidebar} />
                </nav>
              </aside>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <header className="tc-student-topbar rounded-[20px] p-3 md:p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="tc-button-secondary xl:hidden"
                    >
                      Menu
                    </button>
                  </div>
                  <h1 className="tc-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl xl:mt-0">
                    {shellTitle}
                  </h1>
                  <p className="tc-muted mt-1 max-w-2xl text-sm leading-6">
                    {shellDescription}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="tc-student-chip">
                      {currentTrackLabel}
                    </span>
                    <span className="tc-student-chip">
                      {currentMediumLabel}
                    </span>
                    <span className="tc-student-chip" data-tone="accent">
                      {accessChipLabel}
                    </span>
                  </div>
                </div>

                <div className="tc-admin-toolbar">
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

function formatTrialDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
