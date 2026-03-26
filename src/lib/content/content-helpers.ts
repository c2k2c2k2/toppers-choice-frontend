import type { MarathiEncodedFontKey } from "@/lib/marathi";
import { getMarathiFontKeyFromValue } from "@/lib/marathi";
import { getContentFamilyDefinition } from "@/lib/content/content-config";
import type {
  ContentAccessFilter,
  ContentAccessSummary,
  ContentDetail,
  ContentFamily,
  ContentFilterContext,
  ContentSummary,
  StructuredContentDocument,
} from "@/lib/content/types";

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeNumericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compareNullableNumber(a: number | null, b: number | null) {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return a - b;
}

export function sortContentItems(items: ContentSummary[]) {
  return [...items].sort((left, right) => {
    const featuredOrderComparison = compareNullableNumber(
      left.isFeatured ? normalizeNumericValue(left.featuredOrderIndex) : null,
      right.isFeatured ? normalizeNumericValue(right.featuredOrderIndex) : null,
    );

    if (featuredOrderComparison !== 0) {
      return featuredOrderComparison;
    }

    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    const leftPublishedAtValue = normalizeText(left.publishedAt);
    const rightPublishedAtValue = normalizeText(right.publishedAt);
    const leftPublishedAt = leftPublishedAtValue
      ? Date.parse(leftPublishedAtValue)
      : 0;
    const rightPublishedAt = rightPublishedAtValue
      ? Date.parse(rightPublishedAtValue)
      : 0;

    if (leftPublishedAt !== rightPublishedAt) {
      return rightPublishedAt - leftPublishedAt;
    }

    return left.title.localeCompare(right.title);
  });
}

export function matchesContentContext(
  content: Pick<ContentSummary, "examTracks" | "mediums">,
  context: ContentFilterContext,
) {
  const matchesTrack =
    !context.examTrackId ||
    content.examTracks.length === 0 ||
    content.examTracks.some((examTrack) => examTrack.id === context.examTrackId);

  const matchesMedium =
    !context.mediumId ||
    content.mediums.length === 0 ||
    content.mediums.some((medium) => medium.id === context.mediumId);

  return matchesTrack && matchesMedium;
}

export function filterContentByContext(
  items: ContentSummary[],
  context: ContentFilterContext,
) {
  return sortContentItems(
    items.filter((item) => matchesContentContext(item, context)),
  );
}

export function matchesContentAccessFilter(
  filter: ContentAccessFilter,
  content: Pick<ContentSummary, "access">,
) {
  switch (filter) {
    case "available":
      return content.access.mode === "FULL";
    case "locked":
      return content.access.mode === "LOCKED";
    default:
      return true;
  }
}

export function getContentAccessDescriptor(access: ContentAccessSummary) {
  const accessReason = normalizeText(access.reason);

  if (access.mode === "LOCKED") {
    return {
      badgeLabel: "Premium locked",
      ctaHref: "/pricing",
      ctaLabel: "See plans",
      description:
        accessReason ??
        "This lesson is published, but it requires an active premium entitlement to open the full content.",
    };
  }

  if (access.requiresEntitlement) {
    return {
      badgeLabel: "Premium unlocked",
      ctaHref: null,
      ctaLabel: null,
      description:
        accessReason ??
        "This premium lesson is included in the current entitlement set for this account.",
    };
  }

  return {
    badgeLabel: "Available now",
    ctaHref: null,
    ctaLabel: null,
    description:
      accessReason ??
      "This lesson is available in the authenticated student app right away.",
  };
}

export function formatContentDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
  },
) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en-IN", options).format(
    new Date(normalizedValue),
  );
}

export function formatReadingTime(minutes: unknown) {
  const normalizedMinutes = normalizeNumericValue(minutes);

  if (!normalizedMinutes || normalizedMinutes <= 0) {
    return "Quick read";
  }

  if (normalizedMinutes === 1) {
    return "1 min read";
  }

  return `${normalizedMinutes} min read`;
}

export function getContentTrackLabels(content: Pick<ContentSummary, "examTracks">) {
  return content.examTracks
    .map((examTrack) => {
      return (
        normalizeText(examTrack.shortName) ?? normalizeText(examTrack.name)
      );
    })
    .filter((value): value is string => Boolean(value));
}

export function getContentMediumLabels(content: Pick<ContentSummary, "mediums">) {
  return content.mediums
    .map((medium) => normalizeText(medium.name))
    .filter((value): value is string => Boolean(value));
}

export function getContentMetaText(
  metaJson: Record<string, unknown> | null | undefined,
  key: string,
) {
  return normalizeText(metaJson?.[key]);
}

export function getContentMetaChips(
  metaJson: Record<string, unknown> | null | undefined,
) {
  const chips: string[] = [];
  const monthValue = getContentMetaText(metaJson, "month");
  const lessonLevel = getContentMetaText(metaJson, "lessonLevel");
  const languageMode = getContentMetaText(metaJson, "languageMode");

  if (monthValue) {
    const normalizedMonth = `${monthValue}-01`;
    const parsedMonth = Date.parse(normalizedMonth);

    chips.push(
      Number.isNaN(parsedMonth)
        ? monthValue
        : new Intl.DateTimeFormat("en-IN", {
            month: "short",
            year: "numeric",
          }).format(new Date(parsedMonth)),
    );
  }

  if (lessonLevel) {
    chips.push(`Level: ${lessonLevel}`);
  }

  if (languageMode) {
    chips.push(languageMode);
  }

  return chips;
}

export function resolveStructuredContentFontHint(
  bodyJson: StructuredContentDocument,
  metaJson?: Record<string, unknown> | null,
): MarathiEncodedFontKey | null {
  return (
    getMarathiFontKeyFromValue(metaJson ?? null) ??
    getMarathiFontKeyFromValue(bodyJson)
  );
}

export function getContentFamilyLabel(family: ContentFamily) {
  return getContentFamilyDefinition(family).label;
}

export function isContentDetailViewable(content: Pick<ContentDetail, "bodyJson" | "access">) {
  return content.access.canView && content.bodyJson !== null;
}

export function getContentExcerpt(content: Pick<ContentSummary, "excerpt" | "access">) {
  return normalizeText(content.excerpt) ?? getContentAccessDescriptor(content.access).description;
}
