import type { ApiJsonResponse } from "@/lib/api/openapi";

export type StudentContentListResponse = ApiJsonResponse<"/api/v1/content", "get">;
export type PublicContentListResponse =
  ApiJsonResponse<"/api/v1/public/content", "get">;
export type RawStudentContentDetail = ApiJsonResponse<
  "/api/v1/content/{slug}",
  "get"
>;
export type RawPublicContentDetail = ApiJsonResponse<
  "/api/v1/public/content/{slug}",
  "get"
>;

export type ContentSummary = StudentContentListResponse["items"][number];
export type ContentTrackSummary = ContentSummary["examTracks"][number];
export type ContentMediumSummary = ContentSummary["mediums"][number];
export type ContentAttachment = RawStudentContentDetail["attachments"][number];
export type ContentAccessSummary = ContentSummary["access"];
export type ContentFamily = ContentSummary["family"];
export type ContentFormat = ContentSummary["format"];
export type ContentAccessType = ContentSummary["accessType"];

export type StructuredContentDocument =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export interface ContentDetail
  extends Omit<RawStudentContentDetail, "bodyJson" | "metaJson"> {
  bodyJson: StructuredContentDocument;
  metaJson: Record<string, unknown> | null;
}

export interface PublicContentDetail
  extends Omit<RawPublicContentDetail, "bodyJson" | "metaJson"> {
  bodyJson: StructuredContentDocument;
  metaJson: Record<string, unknown> | null;
}

export interface ContentListFilters {
  family?: ContentFamily | null;
  featuredOnly?: boolean | null;
  format?: ContentFormat | null;
  examTrackId?: string | null;
  mediumId?: string | null;
  search?: string | null;
}

export interface ContentFilterContext {
  examTrackId?: string | null;
  mediumId?: string | null;
}

export type ContentAccessFilter = "all" | "available" | "locked";

export interface ContentFamilyDefinition {
  accentCssVar: string;
  collectionHref: string;
  detailHref: (slug: string) => string;
  discoveryDescription: string;
  emptyDescription: string;
  emptyTitle: string;
  eyebrow: string;
  family: ContentFamily;
  heroDescription: string;
  heroTitle: string;
  hubHref: string;
  label: string;
  shortLabel: string;
}

export interface StructuredSurfaceLink {
  description: string;
  href: string;
  label: string;
}
