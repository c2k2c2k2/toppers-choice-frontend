import {
  getAnnouncementLevelLabel,
  getCmsStatusLabel,
  getCmsVisibilityLabel,
} from "@/lib/admin";
import type {
  CmsAnnouncementLevel,
  CmsStatus,
  CmsVisibility,
} from "@/lib/admin";

function getToneClass(tone: "neutral" | "live" | "warning" | "danger" | "info") {
  switch (tone) {
    case "live":
      return "tc-admin-pill bg-[rgba(0,51,102,0.12)] text-[color:var(--accent-student)]";
    case "warning":
      return "tc-admin-pill bg-[rgba(225,134,0,0.14)] text-[color:var(--accent-public)]";
    case "danger":
      return "tc-admin-pill bg-[rgba(171,35,40,0.14)] text-[#8b2026]";
    case "info":
      return "tc-admin-pill bg-[rgba(0,30,64,0.08)] text-[color:var(--brand)]";
    default:
      return "tc-admin-pill bg-[rgba(0,30,64,0.06)] text-[color:var(--muted)]";
  }
}

export function AdminStatusBadge({
  status,
}: Readonly<{
  status: CmsStatus;
}>) {
  const tone =
    status === "PUBLISHED"
      ? "live"
      : status === "ARCHIVED"
        ? "danger"
        : "warning";

  return <span className={getToneClass(tone)}>{getCmsStatusLabel(status)}</span>;
}

export function AdminVisibilityBadge({
  visibility,
}: Readonly<{
  visibility: CmsVisibility;
}>) {
  const tone = visibility === "PUBLIC" ? "live" : visibility === "INTERNAL" ? "danger" : "info";
  return (
    <span className={getToneClass(tone)}>
      {getCmsVisibilityLabel(visibility)}
    </span>
  );
}

export function AdminAnnouncementLevelBadge({
  level,
}: Readonly<{
  level: CmsAnnouncementLevel;
}>) {
  const tone =
    level === "SUCCESS"
      ? "live"
      : level === "WARNING"
        ? "warning"
        : level === "CRITICAL"
          ? "danger"
          : "info";

  return (
    <span className={getToneClass(tone)}>
      {getAnnouncementLevelLabel(level)}
    </span>
  );
}
