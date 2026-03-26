import { isApiError } from "@/lib/api/errors";
import type {
  CmsAnnouncementLevel,
  CmsCollection,
  CmsRecord,
  CmsSectionSurface,
  CmsSectionType,
  CmsStatus,
  CmsVisibility,
  FileAsset,
} from "@/lib/admin/types";

const CMS_COLLECTION_LABELS: Record<CmsCollection, string> = {
  pages: "Pages",
  banners: "Banners",
  announcements: "Announcements",
  sections: "Sections",
};

const CMS_STATUS_LABELS: Record<CmsStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const CMS_VISIBILITY_LABELS: Record<CmsVisibility, string> = {
  PUBLIC: "Public",
  AUTHENTICATED: "Authenticated",
  INTERNAL: "Internal",
};

const SECTION_SURFACE_LABELS: Record<CmsSectionSurface, string> = {
  LANDING_HOME: "Landing home",
  STUDENT_HOME: "Student home",
};

const SECTION_TYPE_LABELS: Record<CmsSectionType, string> = {
  RICH_TEXT: "Rich text",
  CONTENT_FEED: "Content feed",
  PLAN_HIGHLIGHTS: "Plan highlights",
  CTA_GROUP: "CTA group",
};

const ANNOUNCEMENT_LEVEL_LABELS: Record<CmsAnnouncementLevel, string> = {
  INFO: "Info",
  SUCCESS: "Success",
  WARNING: "Warning",
  CRITICAL: "Critical",
};

export function getCmsCollectionLabel(collection: CmsCollection) {
  return CMS_COLLECTION_LABELS[collection];
}

export function getCmsStatusLabel(status: CmsStatus) {
  return CMS_STATUS_LABELS[status];
}

export function getCmsVisibilityLabel(visibility: CmsVisibility) {
  return CMS_VISIBILITY_LABELS[visibility];
}

export function getCmsSurfaceLabel(surface: CmsSectionSurface) {
  return SECTION_SURFACE_LABELS[surface];
}

export function getCmsSectionTypeLabel(type: CmsSectionType) {
  return SECTION_TYPE_LABELS[type];
}

export function getAnnouncementLevelLabel(level: CmsAnnouncementLevel) {
  return ANNOUNCEMENT_LEVEL_LABELS[level];
}

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function summarizeCmsRecord(record: CmsRecord) {
  if ("slug" in record) {
    return record.slug;
  }

  if ("placement" in record) {
    return record.placement;
  }

  if ("level" in record) {
    return record.level;
  }

  return record.code;
}

export function getCmsRecordAsset(record: CmsRecord | null) {
  if (!record) {
    return null;
  }

  if ("coverImage" in record) {
    return record.coverImage;
  }

  if ("image" in record) {
    return record.image;
  }

  return null;
}

export function safeJsonParse(
  input: string,
  options: {
    allowEmpty?: boolean;
    label: string;
  },
) {
  const trimmed = input.trim();

  if (!trimmed) {
    if (options.allowEmpty) {
      return null;
    }

    throw new Error(`${options.label} is required.`);
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new Error(`${options.label} must be valid JSON.`);
  }
}

export function stringifyJsonInput(value: unknown) {
  if (!value) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function isCmsRecordPublished(record: CmsRecord) {
  return record.status === "PUBLISHED";
}

export function buildAssetDeliveryPath(asset: Pick<FileAsset, "publicDeliveryPath">) {
  return asset.publicDeliveryPath;
}
