"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { useStudentShellStore } from "@/stores";

type StudentNavIcon =
  | "book"
  | "chart"
  | "clipboard"
  | "file"
  | "home"
  | "layers"
  | "mic"
  | "wallet";

interface StudentNavItem {
  href?: string;
  icon: StudentNavIcon;
  label: string;
  shortLabel: string;
  status: "live" | "soon";
}

const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    href: "/student",
    icon: "home",
    label: "Dashboard",
    shortLabel: "Home",
    status: "live",
  },
  {
    href: "/student/catalog",
    icon: "layers",
    label: "Catalog",
    shortLabel: "Catalog",
    status: "live",
  },
  {
    href: "/student/guidance",
    icon: "book",
    label: "Guidance",
    shortLabel: "Guidance",
    status: "live",
  },
  {
    href: "/student/english-speaking",
    icon: "mic",
    label: "English speaking",
    shortLabel: "English",
    status: "live",
  },
  {
    href: "/student/notes",
    icon: "file",
    label: "Notes",
    shortLabel: "Notes",
    status: "live",
  },
  {
    href: "/student/practice",
    icon: "chart",
    label: "Practice",
    shortLabel: "Practice",
    status: "live",
  },
  {
    href: "/student/tests",
    icon: "clipboard",
    label: "Tests",
    shortLabel: "Tests",
    status: "live",
  },
  {
    href: "/student/plans",
    icon: "wallet",
    label: "Plans",
    shortLabel: "Plans",
    status: "live",
  },
];

function subscribeToMobileViewport(callback: () => void) {
  const mediaQuery = window.matchMedia("(max-width: 767px)");

  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

function getMobileViewportSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getServerMobileViewportSnapshot() {
  return false;
}

function useIsMobileViewport() {
  return useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );
}

function isActivePath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/student") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function StudentNavIconGlyph({
  icon,
}: Readonly<{
  icon: StudentNavIcon;
}>) {
  const paths: Record<StudentNavIcon, ReactNode> = {
    book: (
      <>
        <path d="M5 4.5h5.2c1 0 1.8.8 1.8 1.8v13.2H6.8A1.8 1.8 0 0 1 5 17.7V4.5Z" />
        <path d="M12 6.3c0-1 .8-1.8 1.8-1.8H19v13.2a1.8 1.8 0 0 1-1.8 1.8H12V6.3Z" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V5" />
        <path d="M5 19h14" />
        <path d="M8.5 15.5v-4" />
        <path d="M12 15.5v-7" />
        <path d="M15.5 15.5v-9" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 5h6" />
        <path d="M9.5 3.5h5a1 1 0 0 1 1 1V6h-7V4.5a1 1 0 0 1 1-1Z" />
        <path d="M7 5.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 20.5h12A1.5 1.5 0 0 0 19.5 19V7A1.5 1.5 0 0 0 18 5.5h-1" />
        <path d="M8 11h8" />
        <path d="M8 15h6" />
      </>
    ),
    file: (
      <>
        <path d="M7 3.5h7l4 4v13H7v-17Z" />
        <path d="M14 3.5v4h4" />
        <path d="M9.5 12h5" />
        <path d="M9.5 15.5h5" />
      </>
    ),
    home: (
      <>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10v9.5h11V10" />
        <path d="M10 19.5v-5h4v5" />
      </>
    ),
    layers: (
      <>
        <path d="m12 4 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </>
    ),
    mic: (
      <>
        <path d="M12 4.5a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0v-4a3 3 0 0 0-3-3Z" />
        <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
        <path d="M12 17v3" />
      </>
    ),
    wallet: (
      <>
        <path d="M4.5 7.5h15v11h-15v-11Z" />
        <path d="M6 5h11.5v2.5" />
        <path d="M15.5 13h4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[icon]}
    </svg>
  );
}

export function StudentShellNavigation({
  compact = false,
  iconOnly = false,
  onNavigate,
}: Readonly<{
  compact?: boolean;
  iconOnly?: boolean;
  onNavigate?: () => void;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      {STUDENT_NAV_ITEMS.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`tc-student-nav-link ${compact ? "items-start" : ""} ${iconOnly ? "justify-center px-0" : ""}`}
              data-active={isActive}
              title={iconOnly ? item.label : undefined}
            >
              <StudentNavIconGlyph icon={item.icon} />
              {!iconOnly ? (
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-[color:var(--brand)]">
                  {compact ? item.shortLabel : item.label}
                </span>
              </span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
              {item.status === "soon" ? (
                <span className="tc-nav-badge" data-status={item.status}>
                  Soon
                </span>
              ) : null}
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            className={`tc-student-nav-link ${compact ? "items-start" : ""} ${iconOnly ? "justify-center px-0" : ""}`}
            data-disabled="true"
            title={iconOnly ? item.label : undefined}
          >
            <StudentNavIconGlyph icon={item.icon} />
            {!iconOnly ? (
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-semibold text-[color:var(--brand)]">
                {compact ? item.shortLabel : item.label}
              </span>
            </span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
            <span className="tc-nav-badge" data-status={item.status}>
              Soon
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StudentBottomNavigation() {
  const pathname = usePathname();
  const isVisible = useStudentShellStore((state) => state.bottomNavVisible);
  const isMobileViewport = useIsMobileViewport();
  const isImmersiveAssessmentRoute =
    pathname.startsWith("/student/practice/session/") ||
    pathname.startsWith("/student/tests/attempts/");
  const hideBottomNavOnRoute =
    isImmersiveAssessmentRoute || pathname.startsWith("/student/plans");

  if (!isVisible || !isMobileViewport || hideBottomNavOnRoute) {
    return null;
  }

  const liveItems = STUDENT_NAV_ITEMS.filter((item) =>
    [
      "/student",
      "/student/catalog",
      "/student/guidance",
      "/student/english-speaking",
      "/student/notes",
    ].includes(item.href ?? ""),
  );

  return (
    <div className="tc-bottom-nav lg:hidden">
      <div
        className="tc-bottom-nav-shell"
        style={{
          gridTemplateColumns: `repeat(${liveItems.length}, minmax(0, 1fr))`,
        }}
      >
        {liveItems.map((item) => (
          <Link
            key={item.label}
            href={item.href ?? "/student"}
            className="tc-bottom-nav-link"
            data-active={isActivePath(pathname, item.href)}
          >
            <span className="font-semibold">{item.shortLabel}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
