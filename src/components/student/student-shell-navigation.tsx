"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudentShellStore } from "@/stores";

interface StudentNavItem {
  description: string;
  href?: string;
  label: string;
  shortLabel: string;
  status: "live" | "soon";
}

const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    href: "/student",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Daily summary, announcements, and quick actions.",
    status: "live",
  },
  {
    href: "/student/catalog",
    label: "Catalog",
    shortLabel: "Catalog",
    description: "Tracks, mediums, subjects, and topic navigation.",
    status: "live",
  },
  {
    href: "/student/guidance",
    label: "Guidance",
    shortLabel: "Guidance",
    description: "Career guidance, interviews, English speaking, and current affairs.",
    status: "live",
  },
  {
    href: "/student/notes",
    label: "Notes",
    shortLabel: "Notes",
    description: "Notes library, previews, and secure reading sessions.",
    status: "live",
  },
  {
    href: "/student/practice",
    label: "Practice",
    shortLabel: "Practice",
    description: "Weak-area practice and progress review.",
    status: "live",
  },
  {
    href: "/student/tests",
    label: "Tests",
    shortLabel: "Tests",
    description: "Timed assessments and attempt history.",
    status: "live",
  },
  {
    href: "/student/plans",
    label: "Plans",
    shortLabel: "Plans",
    description: "Entitlements, checkout, and access refresh.",
    status: "live",
  },
];

function isActivePath(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentShellNavigation({
  compact = false,
  onNavigate,
}: Readonly<{
  compact?: boolean;
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
              className={`tc-student-nav-link ${compact ? "items-start" : ""}`}
              data-active={isActive}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-[color:var(--brand)]">
                  {compact ? item.shortLabel : item.label}
                </span>
                {!compact ? (
                  <span className="tc-muted text-xs leading-5">
                    {item.description}
                  </span>
                ) : null}
              </span>
              {item.status === "soon" ? (
                <span className="tc-nav-badge" data-status={item.status}>
                  Soon
                </span>
              ) : isActive && !compact ? (
                <span className="tc-student-chip" data-tone="soft">
                  Open
                </span>
              ) : null}
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            className={`tc-student-nav-link ${compact ? "items-start" : ""}`}
            data-disabled="true"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-semibold text-[color:var(--brand)]">
                {compact ? item.shortLabel : item.label}
              </span>
              {!compact ? (
                <span className="tc-muted text-xs leading-5">
                  {item.description}
                </span>
              ) : null}
            </span>
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
  const isImmersiveAssessmentRoute =
    pathname.startsWith("/student/practice/session/") ||
    pathname.startsWith("/student/tests/attempts/");
  const hideBottomNavOnRoute =
    isImmersiveAssessmentRoute || pathname.startsWith("/student/plans");

  if (!isVisible || hideBottomNavOnRoute) {
    return null;
  }

  const liveItems = STUDENT_NAV_ITEMS.filter((item) => item.href).slice(0, 4);

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
