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
  type StudentExamTrack,
} from "@/lib/student";
import { startTrial, type TrialAccess } from "@/lib/trial";
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

function StudentTrackMenu({
  disabled,
  examTracks,
  selectedCode,
  selectedLabel,
  onNavigate,
  onSelectTrack,
}: Readonly<{
  disabled: boolean;
  examTracks: StudentExamTrack[];
  selectedCode: string | null;
  selectedLabel: string;
  onNavigate: (href: string) => void;
  onSelectTrack: (code: string) => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  function close() {
    setIsOpen(false);
  }

  return (
    <div className="tc-student-track-menu">
      <button
        type="button"
        className="tc-student-track-menu-trigger"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{selectedLabel}</span>
        <span aria-hidden="true" className="tc-student-track-menu-caret">
          v
        </span>
      </button>

      {isOpen ? (
        <div className="tc-student-track-menu-list" role="menu">
          {examTracks.length > 0 ? (
            examTracks.map((examTrack) => (
              <button
                key={examTrack.id}
                type="button"
                className="tc-student-track-menu-item"
                data-active={selectedCode === examTrack.code}
                role="menuitem"
                onClick={() => {
                  onSelectTrack(examTrack.code);
                  close();
                }}
              >
                {getTrackLabel(examTrack)}
              </button>
            ))
          ) : (
            <span className="tc-student-track-menu-empty">Track</span>
          )}

          <div className="tc-student-track-menu-divider" />

          <button
            type="button"
            className="tc-student-track-menu-item"
            role="menuitem"
            onClick={() => {
              onNavigate("/student/english-speaking");
              close();
            }}
          >
            English Speaking
          </button>
          <button
            type="button"
            className="tc-student-track-menu-item"
            role="menuitem"
            onClick={() => {
              onNavigate("/student/guidance");
              close();
            }}
          >
            Career Guidance
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StudentShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authSession = useAuthSession();
  const [trialAccess, setTrialAccess] = useState<TrialAccess | null>(null);
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
  const effectiveTrialAccess = hasActiveEntitlement ? null : trialAccess;

  useEffect(() => {
    closeSidebar();
  }, [closeSidebar, pathname]);

  useEffect(() => {
    ensureAccessTokenRef.current = authSession.ensureAccessToken;
  }, [authSession.ensureAccessToken]);

  useEffect(() => {
    let cancelled = false;

    async function startTrialWindow() {
      if (
        !authSession.isReady ||
        !authSession.isAuthenticated ||
        authSession.user?.userType !== "STUDENT" ||
        !entitlementsReady ||
        hasActiveEntitlement
      ) {
        return;
      }

      const accessToken = await ensureAccessTokenRef.current();

      if (!accessToken || cancelled) {
        return;
      }

      const nextTrial = await startTrialOnce(accessToken);
      if (!cancelled) {
        setTrialAccess(nextTrial);
      }
    }

    void startTrialWindow().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [
    authSession.isAuthenticated,
    authSession.isReady,
    authSession.user?.userType,
    entitlementsReady,
    hasActiveEntitlement,
  ]);

  useEffect(() => {
    if (hasActiveEntitlement || !trialAccess?.hasAccess) {
      return;
    }

    const timeoutId = setTimeout(
      () => {
        setTrialAccess({
          ...trialAccess,
          hasAccess: false,
          remainingSeconds: 0,
          status: "EXHAUSTED",
        });
      },
      Math.max(0, trialAccess.remainingSeconds * 1000),
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasActiveEntitlement, trialAccess]);

  useEffect(() => {
    if (
      hasActiveEntitlement ||
      !entitlementsReady ||
      !effectiveTrialAccess ||
      effectiveTrialAccess.hasAccess ||
      pathname.startsWith("/student/plans")
    ) {
      return;
    }

    router.replace(
      `/student/plans?intent=all&source=trial-expired&returnTo=${encodeURIComponent(
        pathname || "/student",
      )}`,
    );
  }, [
    entitlementsReady,
    effectiveTrialAccess,
    hasActiveEntitlement,
    pathname,
    router,
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
    await authSession.logout();
    router.replace("/student/login");
  }

  const trialRemainingLabel = effectiveTrialAccess
    ? formatTrialDuration(effectiveTrialAccess.remainingSeconds)
    : "1 day";
  const trialChipLabel =
    effectiveTrialAccess && !effectiveTrialAccess.enabled
      ? "Trial paused"
      : effectiveTrialAccess?.hasAccess === false
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
      className="tc-student-menu-button tc-student-menu-button-desktop"
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
                isDesktopSidebarCollapsed ? "items-center text-center" : ""
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
                    className="tc-student-menu-button tc-student-menu-button-mobile"
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
                  <StudentTrackMenu
                    disabled={!catalogQuery.data?.examTracks.length}
                    examTracks={catalogQuery.data?.examTracks ?? []}
                    selectedCode={catalogSnapshot?.selectedTrack?.code ?? null}
                    selectedLabel={getTrackLabel(catalogSnapshot?.selectedTrack ?? null)}
                    onNavigate={(href) => router.push(href)}
                    onSelectTrack={setActiveExamTrackCode}
                  />
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

            <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
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
  const days = Math.floor(seconds / 86_400);
  const remainingAfterDays = seconds % 86_400;
  const hours = Math.floor(remainingAfterDays / 3600);
  const remainingAfterHours = remainingAfterDays % 3600;
  const minutes = Math.floor(remainingAfterHours / 60);
  const remainingSeconds = remainingAfterHours % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const totalMinutes = Math.floor(seconds / 60);

  if (totalMinutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return remainingSeconds > 0
    ? `${totalMinutes}m ${remainingSeconds}s`
    : `${totalMinutes}m`;
}
