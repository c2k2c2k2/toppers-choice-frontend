import type { ApiJsonRequestBody } from "@/lib/api/openapi";
import type { MarathiEncodedFontKey } from "@/lib/marathi";

export interface NotesListFilters {
  mediumId?: string | null;
  search?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
}

export interface NoteTopicSummary {
  code: string;
  id: string;
  isActive: boolean;
  name: string;
  orderIndex: number;
  parentId: string | null;
  slug: string;
}

export interface NoteAccessSummary {
  canStartViewSession: boolean;
  mode: "FULL" | "LOCKED" | "PREVIEW";
  previewPageCount: number | null;
  reason: string | null;
  requiresEntitlement: boolean;
}

export interface NoteProgressResponse {
  completedAt: string | null;
  completionPercent: number;
  lastPageViewed: number;
  lastViewedAt: string | null;
  maxPageViewed: number;
  noteId: string;
  updatedAt: string;
  userId: string;
}

export interface NoteSubjectSummary {
  examTrackId: string;
  id: string;
  name: string;
  slug: string;
}

export interface NoteMediumSummary {
  id: string;
  name: string;
  slug: string;
}

export interface NoteSummary {
  access: NoteAccessSummary;
  accessType: "FREE" | "PREMIUM_ONLY" | "PREVIEWABLE_PREMIUM";
  archivedAt: string | null;
  coverImageAssetId: string | null;
  createdAt: string;
  description: string | null;
  fullFileAssetId: string;
  id: string;
  medium: NoteMediumSummary | null;
  mediumId: string | null;
  orderIndex: number;
  pageCount: number;
  previewFileAssetId: string | null;
  previewPageCount: number | null;
  progress: NoteProgressResponse | null;
  publishedAt: string | null;
  shortDescription: string | null;
  siteId: string;
  slug: string;
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED";
  subject: NoteSubjectSummary;
  subjectId: string;
  title: string;
  topics: NoteTopicSummary[];
  updatedAt: string;
}

export interface NotesListResponse {
  items: NoteSummary[];
  total: number;
}

export interface NoteTreeTopicNode extends NoteTopicSummary {
  children: NoteTreeTopicNode[];
  notes: NoteSummary[];
}

export interface NoteTreeSubjectNode {
  examTrackId: string;
  id: string;
  name: string;
  notes: NoteSummary[];
  slug: string;
  topics: NoteTreeTopicNode[];
}

export interface NotesTreeResponse {
  subjects: NoteTreeSubjectNode[];
}

export type NoteDetailResponse = NoteSummary;

export interface NoteViewSessionResponse {
  accessMode: "FULL" | "PREVIEW";
  contentPath: string;
  expiresAt: string;
  noteId: string;
  noteViewSessionId: string;
  noteViewToken: string;
  previewPageCount: number | null;
  watermarkPath: string;
}

export type UpdateNoteProgressInput = ApiJsonRequestBody<
  "/api/v1/notes/{noteId}/progress",
  "post"
>;

export interface NoteWatermarkResponse {
  accessMode: "FULL" | "PREVIEW";
  displayName: string;
  generatedAt: string;
  maskedEmail: string;
  noteId: string;
  noteViewSessionId: string;
  signature: string;
  watermarkSeed: string;
}

export type NoteAccessMode = NoteSummary["access"]["mode"];

export interface NoteIndexEntry {
  createdAt: string;
  id: string;
  indentLevel: number;
  noteId: string;
  orderIndex: number;
  pageNumber: number;
  serialLabel: string | null;
  title: string;
  titleFontHint: MarathiEncodedFontKey | null;
  updatedAt: string;
}

export interface NoteIndexListResponse {
  items: NoteIndexEntry[];
}

export interface NoteBookmark {
  createdAt: string;
  id: string;
  label: string | null;
  noteId: string;
  noteIndexEntryId: string | null;
  pageNumber: number;
  updatedAt: string;
  userId: string;
}

export interface NoteBookmarkListResponse {
  items: NoteBookmark[];
}

export interface UpsertNoteBookmarkInput {
  label?: string;
  noteIndexEntryId?: string;
  pageNumber: number;
}
