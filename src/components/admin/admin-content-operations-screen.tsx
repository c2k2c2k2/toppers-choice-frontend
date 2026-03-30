"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminContent,
  createAdminNote,
  formatAdminDateTime,
  getAdminContent,
  getApiErrorMessage,
  listAdminContent,
  listAdminNotes,
  parseIdListInput,
  parseOptionalInteger,
  publishAdminContent,
  publishAdminNote,
  unfeatureAdminContent,
  unpublishAdminContent,
  unpublishAdminNote,
  updateAdminContent,
  updateAdminNote,
  featureAdminContent,
  type ContentAccessType,
  type ContentFamily,
  type ContentFormat,
  type ContentStatus,
  type NoteAccessType,
  type NoteStatus,
} from "@/lib/admin";
import {
  AdminAttachmentsEditor,
  buildAttachmentRows,
  serializeAttachmentRows,
  type AdminAttachmentRow,
} from "@/components/admin/admin-attachments-editor";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminFontTextField } from "@/components/admin/admin-font-text-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import {
  AdminKeyValueEditor,
  parseKeyValueObject,
  serializeKeyValueRows,
  type AdminKeyValueRow,
} from "@/components/admin/admin-key-value-editor";
import {
  AdminRichHtmlField,
} from "@/components/admin/admin-rich-html-field";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  buildStructuredDocumentFromHtml,
  readStructuredDocumentHtml,
} from "@/lib/admin/rich-text";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";

type ContentWorkspaceTab = "notes" | "content";

interface NoteFormState {
  accessType: NoteAccessType;
  coverImageAssetId: string;
  description: string;
  fullFileAssetId: string;
  mediumId: string;
  orderIndex: string;
  pageCount: string;
  previewFileAssetId: string;
  previewPageCount: string;
  shortDescription: string;
  slug: string;
  subjectId: string;
  title: string;
  topicIds: string;
}

interface StructuredContentFormState {
  accessType: ContentAccessType;
  attachments: AdminAttachmentRow[];
  bodyHtml: string;
  coverImageAssetId: string;
  examTrackIds: string[];
  excerpt: string;
  family: ContentFamily;
  featuredOrderIndex: string;
  format: ContentFormat;
  mediumIds: string[];
  metaRows: AdminKeyValueRow[];
  orderIndex: string;
  readingTimeMinutes: string;
  slug: string;
  title: string;
  visibility: "PUBLIC" | "AUTHENTICATED" | "INTERNAL";
}

const NOTE_STATUS_OPTIONS: NoteStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const NOTE_ACCESS_OPTIONS: NoteAccessType[] = [
  "FREE",
  "PREVIEWABLE_PREMIUM",
  "PREMIUM_ONLY",
];
const CONTENT_STATUS_OPTIONS: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const CONTENT_ACCESS_OPTIONS: ContentAccessType[] = ["FREE", "PREMIUM"];
const CONTENT_FAMILY_OPTIONS: ContentFamily[] = [
  "CAREER_GUIDANCE",
  "INTERVIEW_GUIDANCE",
  "ENGLISH_SPEAKING",
  "CURRENT_AFFAIRS",
  "MONTHLY_UPDATE",
];
const CONTENT_FORMAT_OPTIONS: ContentFormat[] = ["ARTICLE", "LESSON", "FEED_ITEM"];

const EMPTY_NOTE_FORM_STATE: NoteFormState = {
  accessType: "FREE",
  coverImageAssetId: "",
  description: "",
  fullFileAssetId: "",
  mediumId: "",
  orderIndex: "",
  pageCount: "",
  previewFileAssetId: "",
  previewPageCount: "",
  shortDescription: "",
  slug: "",
  subjectId: "",
  title: "",
  topicIds: "",
};

const EMPTY_CONTENT_FORM_STATE: StructuredContentFormState = {
  accessType: "FREE",
  attachments: [],
  bodyHtml: "",
  coverImageAssetId: "",
  examTrackIds: [],
  excerpt: "",
  family: "CAREER_GUIDANCE",
  featuredOrderIndex: "",
  format: "ARTICLE",
  mediumIds: [],
  metaRows: [],
  orderIndex: "",
  readingTimeMinutes: "",
  slug: "",
  title: "",
  visibility: "PUBLIC",
};

function WorkspaceStatCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string | number;
}>) {
  return (
    <section className="tc-admin-frame-subtle rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-[color:var(--brand)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
        {detail}
      </p>
    </section>
  );
}

function buildNoteFormState(
  note: Awaited<ReturnType<typeof listAdminNotes>>["items"][number] | null,
): NoteFormState {
  if (!note) {
    return EMPTY_NOTE_FORM_STATE;
  }

  return {
    accessType: note.accessType,
    coverImageAssetId:
      typeof note.coverImageAssetId === "string" ? note.coverImageAssetId : "",
    description: typeof note.description === "string" ? note.description : "",
    fullFileAssetId: note.fullFileAssetId,
    mediumId: typeof note.mediumId === "string" ? note.mediumId : "",
    orderIndex: String(note.orderIndex),
    pageCount: String(note.pageCount),
    previewFileAssetId:
      typeof note.previewFileAssetId === "string" ? note.previewFileAssetId : "",
    previewPageCount:
      typeof note.previewPageCount === "number" ? String(note.previewPageCount) : "",
    shortDescription:
      typeof note.shortDescription === "string" ? note.shortDescription : "",
    slug: note.slug,
    subjectId: note.subjectId,
    title: note.title,
    topicIds: note.topics.map((topic) => topic.id).join(", "),
  };
}

function buildContentFormState(
  content: Awaited<ReturnType<typeof getAdminContent>> | null,
): StructuredContentFormState {
  if (!content) {
    return EMPTY_CONTENT_FORM_STATE;
  }

  return {
    accessType: content.accessType,
    attachments: buildAttachmentRows(content.attachments),
    bodyHtml: readStructuredDocumentHtml(content.bodyJson),
    coverImageAssetId:
      typeof content.coverImage?.id === "string" ? content.coverImage.id : "",
    examTrackIds: content.examTracks.map((track) => track.id),
    excerpt: typeof content.excerpt === "string" ? content.excerpt : "",
    family: content.family,
    featuredOrderIndex:
      typeof content.featuredOrderIndex === "number"
        ? String(content.featuredOrderIndex)
        : "",
    format: content.format,
    mediumIds: content.mediums.map((medium) => medium.id),
    metaRows: parseKeyValueObject(content.metaJson),
    orderIndex: String(content.orderIndex),
    readingTimeMinutes:
      typeof content.readingTimeMinutes === "number"
        ? String(content.readingTimeMinutes)
        : "",
    slug: content.slug,
    title: content.title,
    visibility: content.visibility,
  };
}

export function AdminContentOperationsScreen({
  initialTab,
  contentId = null,
  contentView = "workspace",
}: Readonly<{
  initialTab: ContentWorkspaceTab;
  contentId?: string | null;
  contentView?: "editor" | "list" | "workspace";
}>) {
  const authSession = useAuthSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const taxonomy = useAdminTaxonomyReferenceData();
  const canReadNotes = authSession.hasPermission("content.notes.read");
  const canManageNotes = authSession.hasPermission("content.notes.manage");
  const canPublishNotes = authSession.hasPermission("content.notes.publish");
  const canReadContent = authSession.hasPermission("content.structured.read");
  const canManageContent = authSession.hasPermission("content.structured.manage");
  const canPublishContent = authSession.hasPermission("content.structured.publish");

  const [searchValue, setSearchValue] = useState("");
  const [noteStatus, setNoteStatus] = useState<NoteStatus | "">("");
  const [noteAccessType, setNoteAccessType] = useState<NoteAccessType | "">("");
  const [noteSubjectId, setNoteSubjectId] = useState("");
  const [noteTopicId, setNoteTopicId] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState<NoteFormState>(EMPTY_NOTE_FORM_STATE);

  const [contentStatus, setContentStatus] = useState<ContentStatus | "">("");
  const [contentAccessType, setContentAccessType] = useState<ContentAccessType | "">("");
  const [contentFamily, setContentFamily] = useState<ContentFamily | "">("");
  const [contentMediumId, setContentMediumId] = useState("");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState<StructuredContentFormState>(
    EMPTY_CONTENT_FORM_STATE,
  );
  const [message, setMessage] = useState<string | null>(null);
  const isContentEditorMode = initialTab === "content" && contentView === "editor";
  const isContentListMode = initialTab === "content" && contentView === "list";
  const isCreatingContent = isContentEditorMode && !contentId;

  const notesQuery = useAuthenticatedQuery({
    enabled: initialTab === "notes" && canReadNotes,
    queryFn: (accessToken) =>
      listAdminNotes(accessToken, {
        accessType: noteAccessType || undefined,
        search: searchValue || undefined,
        status: noteStatus || undefined,
        subjectId: noteSubjectId || undefined,
        topicId: noteTopicId || undefined,
      }),
    queryKey: adminQueryKeys.notes({
      accessType: noteAccessType || null,
      search: searchValue || null,
      status: noteStatus || null,
      subjectId: noteSubjectId || null,
      topicId: noteTopicId || null,
    }),
    staleTime: 30_000,
  });

  const contentQuery = useAuthenticatedQuery({
    enabled: initialTab === "content" && canReadContent,
    queryFn: (accessToken) =>
      listAdminContent(accessToken, {
        accessType: contentAccessType || undefined,
        family: contentFamily || undefined,
        mediumId: contentMediumId || undefined,
        search: searchValue || undefined,
        status: contentStatus || undefined,
      }),
    queryKey: adminQueryKeys.content({
      accessType: contentAccessType || null,
      family: contentFamily || null,
      format: null,
      mediumId: contentMediumId || null,
      search: searchValue || null,
      status: contentStatus || null,
      visibility: null,
    }),
    staleTime: 30_000,
  });

  const contentDetailQuery = useAuthenticatedQuery({
    enabled:
      initialTab === "content" &&
      canReadContent &&
      Boolean(isContentEditorMode ? contentId : selectedContentId),
    queryFn: (accessToken) =>
      getAdminContent(isContentEditorMode ? (contentId ?? "") : (selectedContentId ?? ""), accessToken),
    queryKey: [
      "admin",
      "content",
      "detail",
      isContentEditorMode ? (contentId ?? "new") : (selectedContentId ?? "new"),
    ],
    staleTime: 30_000,
  });

  const selectedNote = useMemo(() => {
    const items = notesQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }

    return items.find((note) => note.id === selectedNoteId) ?? items[0];
  }, [notesQuery.data?.items, selectedNoteId]);

  const selectedContent = contentDetailQuery.data ?? null;

  useEffect(() => {
    setMessage(null);
  }, [initialTab]);

  useEffect(() => {
    setNoteForm(buildNoteFormState(selectedNote));
  }, [selectedNote]);

  useEffect(() => {
    setContentForm(buildContentFormState(selectedContent));
  }, [selectedContent]);

  useEffect(() => {
    if (initialTab === "notes") {
      setSelectedContentId(null);
    } else {
      setSelectedNoteId(null);
      setSelectedContentId(contentId ?? null);
    }
  }, [contentId, initialTab]);

  const noteSaveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        accessType: noteForm.accessType,
        coverImageAssetId: noteForm.coverImageAssetId.trim() || undefined,
        description: noteForm.description.trim() || undefined,
        fullFileAssetId: noteForm.fullFileAssetId.trim(),
        mediumId: noteForm.mediumId.trim() || undefined,
        orderIndex: parseOptionalInteger(noteForm.orderIndex),
        pageCount: parseOptionalInteger(noteForm.pageCount),
        previewFileAssetId: noteForm.previewFileAssetId.trim() || undefined,
        previewPageCount: parseOptionalInteger(noteForm.previewPageCount),
        shortDescription: noteForm.shortDescription.trim() || undefined,
        slug: noteForm.slug.trim() || undefined,
        subjectId: noteForm.subjectId.trim(),
        title: noteForm.title.trim(),
        topicIds: parseIdListInput(noteForm.topicIds),
      };

      if (!input.title || !input.subjectId || !input.fullFileAssetId || !input.pageCount) {
        throw new Error("Title, subject, full file asset, and page count are required.");
      }

      const normalizedInput = {
        ...input,
        pageCount: input.pageCount,
      };

      if (selectedNote) {
        return updateAdminNote(selectedNote.id, normalizedInput, accessToken);
      }

      return createAdminNote(normalizedInput, accessToken);
    },
    onSuccess: async (note) => {
      setSelectedNoteId(note.id);
      setMessage("Note record saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "notes"] });
    },
  });

  const notePublishMutation = useAuthenticatedMutation({
    mutationFn: async (action: "publish" | "unpublish", accessToken) => {
      if (!selectedNote) {
        throw new Error("Select a note first.");
      }

      return action === "publish"
        ? publishAdminNote(selectedNote.id, accessToken)
        : unpublishAdminNote(selectedNote.id, accessToken);
    },
    onSuccess: async () => {
      setMessage("Note publication state updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "notes"] });
    },
  });

  const contentSaveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const title = contentForm.title.trim();
      const bodyJson = buildStructuredDocumentFromHtml(contentForm.bodyHtml);
      const input = {
        accessType: contentForm.accessType,
        attachments: serializeAttachmentRows(contentForm.attachments),
        bodyJson: bodyJson as unknown as Record<string, never>,
        coverImageAssetId: contentForm.coverImageAssetId.trim() || undefined,
        examTrackIds: contentForm.examTrackIds,
        excerpt: contentForm.excerpt.trim() || undefined,
        family: contentForm.family,
        format: contentForm.format,
        mediumIds: contentForm.mediumIds,
        metaJson: serializeKeyValueRows(contentForm.metaRows) as
          | Record<string, never>
          | undefined,
        orderIndex: parseOptionalInteger(contentForm.orderIndex),
        readingTimeMinutes: parseOptionalInteger(contentForm.readingTimeMinutes),
        slug: contentForm.slug.trim() || undefined,
        title,
        visibility: contentForm.visibility,
      };

      if (!input.title || !bodyJson) {
        throw new Error("A title and body are required.");
      }

      if (selectedContentId || contentId) {
        return updateAdminContent(selectedContentId ?? contentId ?? "", input, accessToken);
      }

      return createAdminContent(input, accessToken);
    },
    onSuccess: async (content) => {
      setSelectedContentId(content.id);
      setMessage("Structured content saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "content"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "content", "detail", content.id],
        }),
      ]);

      if (isContentEditorMode) {
        router.replace(`/admin/content/${content.id}`);
      }
    },
  });

  const contentPublishMutation = useAuthenticatedMutation({
    mutationFn: async (action: "publish" | "unpublish" | "feature" | "unfeature", accessToken) => {
      if (!(selectedContentId || contentId)) {
        throw new Error("Select a structured content record first.");
      }

      const activeContentId = selectedContentId ?? contentId ?? "";

      if (action === "publish") {
        return publishAdminContent(activeContentId, accessToken, {});
      }

      if (action === "unpublish") {
        return unpublishAdminContent(activeContentId, accessToken);
      }

      if (action === "feature") {
        return featureAdminContent(
          activeContentId,
          {
            featuredOrderIndex: parseOptionalInteger(contentForm.featuredOrderIndex),
          },
          accessToken,
        );
      }

      return unfeatureAdminContent(activeContentId, accessToken);
    },
    onSuccess: async () => {
      setMessage("Structured content state updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "content"] }),
        queryClient.invalidateQueries({
          queryKey: [
            "admin",
            "content",
            "detail",
            selectedContentId ?? contentId ?? "new",
          ],
        }),
      ]);
    },
  });

  const activeCanRead = initialTab === "notes" ? canReadNotes : canReadContent;
  const activeCanManage = initialTab === "notes" ? canManageNotes : canManageContent;
  if (!activeCanRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This section is not available for this login."
        description="Ask an admin with content access to open this section or update your role."
      />
    );
  }

  if (
    (initialTab === "notes" && notesQuery.isLoading) ||
    (initialTab === "content" &&
      (contentQuery.isLoading || (Boolean(selectedContentId || contentId) && contentDetailQuery.isLoading)))
  ) {
    return (
      <LoadingState
        title={`Loading ${initialTab === "notes" ? "notes" : "structured content"} workspace`}
        description="Fetching the latest records for this section."
      />
    );
  }

  if (
    (initialTab === "notes" && notesQuery.error) ||
    (initialTab === "content" &&
      (contentQuery.error || (Boolean(selectedContentId || contentId) && contentDetailQuery.error)))
  ) {
    return (
      <ErrorState
        title="The content workspace could not be loaded."
        description="We couldn't load this content section right now."
        onRetry={() => {
          if (initialTab === "notes") {
            void notesQuery.refetch();
            return;
          }

          void contentQuery.refetch();
          void contentDetailQuery.refetch();
        }}
      />
    );
  }

  const noteRows = notesQuery.data?.items ?? [];
  const contentRows = contentQuery.data?.items ?? [];
  const notePublishedCount = noteRows.filter((row) => row.status === "PUBLISHED").length;
  const notePremiumCount = noteRows.filter((row) => row.accessType !== "FREE").length;
  const uniqueNoteSubjects = new Set(noteRows.map((row) => row.subjectId)).size;
  const contentPublishedCount = contentRows.filter((row) => row.status === "PUBLISHED").length;
  const contentDraftCount = contentRows.filter((row) => row.status === "DRAFT").length;
  const contentFeaturedCount = contentRows.filter((row) => row.isFeatured).length;
  const contentFamilyCount = new Set(contentRows.map((row) => row.family)).size;
  const activeFilterCount =
    initialTab === "notes"
      ? [searchValue.trim(), noteStatus, noteAccessType, noteSubjectId, noteTopicId].filter(
          Boolean,
        ).length
      : [
          searchValue.trim(),
          contentStatus,
          contentAccessType,
          contentFamily,
          contentMediumId,
        ].filter(Boolean).length;
  const contentFamilyBreakdown = CONTENT_FAMILY_OPTIONS.map((family) => ({
    family,
    count: contentRows.filter((row) => row.family === family).length,
  })).filter((item) => item.count > 0);
  const workspaceGridClass =
    initialTab === "content"
      ? isContentListMode
        ? "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_22rem]"
        : "grid gap-6"
      : "grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]";

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Authoring"
        title={
          initialTab === "notes"
            ? "Notes manager"
            : isContentEditorMode
              ? isCreatingContent
                ? "Create content entry"
                : "Edit content entry"
              : "Content manager"
        }
        description={
          initialTab === "notes"
            ? "Create, update, and publish note records without leaving the main workspace."
            : isContentEditorMode
              ? "Focus on one content record at a time with Marathi-ready fields and guided editors."
              : "Review the full structured-content library, trim noise with filters, and open focused editor pages only when needed."
        }
        actions={
          initialTab === "content" ? (
            isContentEditorMode ? (
              <Link href="/admin/content" className="tc-button-secondary">
                Back to content
              </Link>
            ) : (
              <Link
                href="/admin/content/new"
                className="tc-button-primary"
                aria-disabled={!activeCanManage}
              >
                New content entry
              </Link>
            )
          ) : (
            <button
              type="button"
              className="tc-button-primary"
              disabled={!activeCanManage}
              onClick={() => {
                setMessage(null);
                setSelectedNoteId(null);
                setNoteForm(EMPTY_NOTE_FORM_STATE);
              }}
            >
              New note
            </button>
          )
        }
      />

      <AdminRouteTabs
        activeHref={initialTab === "notes" ? "/admin/notes" : "/admin/content"}
        items={[
          {
            href: "/admin/notes",
            label: "Notes",
            description: "Notes, access settings, and publish status.",
          },
          {
            href: "/admin/content",
            label: "Structured content",
            description: "Guidance and article-style learning content.",
          },
        ]}
      />

      {!isContentEditorMode ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {initialTab === "notes" ? (
            <>
              <WorkspaceStatCard
                label="Visible notes"
                value={noteRows.length}
                detail="Records matching the current search and filter state."
              />
              <WorkspaceStatCard
                label="Published"
                value={notePublishedCount}
                detail="Notes currently ready for students."
              />
              <WorkspaceStatCard
                label="Premium access"
                value={notePremiumCount}
                detail="Notes restricted to previewable or premium access."
              />
              <WorkspaceStatCard
                label="Subjects"
                value={uniqueNoteSubjects}
                detail="Subjects represented in the filtered note list."
              />
            </>
          ) : (
            <>
              <WorkspaceStatCard
                label="Visible entries"
                value={contentRows.length}
                detail="Structured content records matching the current filters."
              />
              <WorkspaceStatCard
                label="Published"
                value={contentPublishedCount}
                detail="Entries already available to students."
              />
              <WorkspaceStatCard
                label="Featured"
                value={contentFeaturedCount}
                detail="Records currently pinned for higher visibility."
              />
              <WorkspaceStatCard
                label="Families"
                value={contentFamilyCount}
                detail="Content families represented in this filtered view."
              />
            </>
          )}
        </div>
      ) : null}

      {initialTab === "notes" || !isContentEditorMode ? (
        <AdminFilterBar
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          searchPlaceholder={
            initialTab === "notes"
              ? "Search notes by title, slug, description, or metadata"
              : "Search structured content by title, slug, excerpt, or body"
          }
          resultSummary={`${initialTab === "notes" ? noteRows.length : contentRows.length} ${
            initialTab === "notes" ? "notes" : "content entries"
          } visible.`}
        >
          {initialTab === "notes" ? (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Status</span>
              <select
                value={noteStatus}
                onChange={(event) => setNoteStatus(event.target.value as NoteStatus | "")}
                className="tc-input"
              >
                <option value="">All statuses</option>
                {NOTE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Access</span>
              <select
                value={noteAccessType}
                onChange={(event) =>
                  setNoteAccessType(event.target.value as NoteAccessType | "")
                }
                className="tc-input"
              >
                <option value="">All access types</option>
                {NOTE_ACCESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Subject</span>
              <select
                value={noteSubjectId}
                onChange={(event) => setNoteSubjectId(event.target.value)}
                className="tc-input"
              >
                <option value="">All subjects</option>
                {taxonomy.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Topic</span>
              <select
                value={noteTopicId}
                onChange={(event) => setNoteTopicId(event.target.value)}
                className="tc-input"
              >
                <option value="">All topics</option>
                {taxonomy.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
          </>
          ) : (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Status</span>
              <select
                value={contentStatus}
                onChange={(event) =>
                  setContentStatus(event.target.value as ContentStatus | "")
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {CONTENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Access</span>
              <select
                value={contentAccessType}
                onChange={(event) =>
                  setContentAccessType(event.target.value as ContentAccessType | "")
                }
                className="tc-input"
              >
                <option value="">All access types</option>
                {CONTENT_ACCESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Family</span>
              <select
                value={contentFamily}
                onChange={(event) =>
                  setContentFamily(event.target.value as ContentFamily | "")
                }
                className="tc-input"
              >
                <option value="">All families</option>
                {CONTENT_FAMILY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Medium</span>
              <select
                value={contentMediumId}
                onChange={(event) => setContentMediumId(event.target.value)}
                className="tc-input"
              >
                <option value="">All mediums</option>
                {taxonomy.mediums.map((medium) => (
                  <option key={medium.id} value={medium.id}>
                    {medium.name}
                  </option>
                ))}
              </select>
            </label>
          </>
          )}
        </AdminFilterBar>
      ) : null}

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {taxonomy.isLoading ? (
        <AdminInlineNotice>
          Taxonomy references are still loading. Raw ID fields can still be edited safely if needed.
        </AdminInlineNotice>
      ) : null}

      {initialTab === "notes" && noteSaveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(noteSaveMutation.error, "The note could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "notes" && notePublishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            notePublishMutation.error,
            "The note publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "content" && contentSaveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            contentSaveMutation.error,
            "The structured content record could not be saved.",
          )}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "content" && contentPublishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            contentPublishMutation.error,
            "The structured content state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      <div className={workspaceGridClass}>
        {(initialTab === "notes" || !isContentEditorMode) ? (
          <section>
          {initialTab === "notes" ? (
            <AdminDataTable
              rows={noteRows}
              getRowId={(row) => row.id}
              selectedRowId={selectedNote?.id ?? null}
              onRowClick={(row) => setSelectedNoteId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Notes"
                  title="No notes matched the current filters."
                  description="Broaden the filters or create a new note record to start the admin note catalog."
                />
              }
              columns={[
                {
                  header: "Note",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{row.slug}</p>
                    </div>
                  ),
                },
                {
                  header: "Access",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <AdminToneBadge
                        tone={row.status === "PUBLISHED" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                        label={row.status}
                      />
                      <AdminToneBadge
                        tone={row.accessType === "FREE" ? "live" : "warning"}
                        label={row.accessType}
                      />
                    </div>
                  ),
                },
                {
                  header: "Catalog",
                  render: (row) => (
                    <p className="text-sm text-[color:var(--muted)]">
                      {row.subjectId}
                      {typeof row.mediumId === "string" ? ` · ${row.mediumId}` : ""}
                    </p>
                  ),
                },
                {
                  header: "Updated",
                  render: (row) => formatAdminDateTime(row.updatedAt),
                },
              ]}
            />
          ) : (
            <AdminDataTable
              rows={contentRows}
              getRowId={(row) => row.id}
              selectedRowId={isContentListMode ? null : selectedContentId}
              onRowClick={(row) =>
                isContentListMode ? router.push(`/admin/content/${row.id}`) : setSelectedContentId(row.id)
              }
              emptyState={
                <EmptyState
                  eyebrow="Structured content"
                  title="No content entries matched the current filters."
                  description="Broaden the filters or create a new entry to start this authoring family."
                />
              }
              columns={[
                {
                  header: "Entry",
                  render: (row) => (
                    <div className="space-y-1">
                      <TextContent
                        as="p"
                        className="font-semibold text-[color:var(--brand)]"
                        value={row.title}
                      />
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.family} · {row.slug}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <AdminToneBadge
                        tone={row.status === "PUBLISHED" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                        label={row.status}
                      />
                      <AdminVisibilityBadge visibility={row.visibility} />
                      <AdminToneBadge
                        tone={row.accessType === "FREE" ? "live" : "warning"}
                        label={row.accessType}
                      />
                    </div>
                  ),
                },
                {
                  header: "Featured",
                  render: (row) => (
                    <AdminToneBadge
                      tone={row.isFeatured ? "live" : "neutral"}
                      label={row.isFeatured ? `Featured #${row.featuredOrderIndex ?? "—"}` : "Standard"}
                    />
                  ),
                },
                {
                  header: "Updated",
                  render: (row) => formatAdminDateTime(row.updatedAt),
                },
              ]}
            />
          )}
          </section>
        ) : null}

        {initialTab === "content" && isContentListMode ? (
          <section className="tc-admin-frame rounded-[28px] p-5 xl:sticky xl:top-4 xl:h-fit">
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Publishing overview
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Use the space for review, not clutter.
            </h2>
            <p className="tc-muted mt-3 text-sm leading-7">
              This layout keeps the library wide for scanning, then moves secondary guidance and quick actions into a compact side panel.
            </p>

            <div className="tc-admin-stat mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Current filters
              </p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--brand)]">
                {activeFilterCount === 0
                  ? "All entries visible"
                  : `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {activeFilterCount === 0
                  ? "Use the search and filter bar when you want to narrow the review to one family, status, access type, or medium."
                  : "Clear filters to return to the full content library and spot issues across the whole catalog."}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {contentFamilyBreakdown.length > 0 ? (
                contentFamilyBreakdown.map((item) => (
                  <div
                    key={item.family}
                    className="tc-admin-frame-subtle rounded-[20px] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--brand)]">
                        {item.family.replaceAll("_", " ")}
                      </p>
                      <span className="tc-admin-chip" data-tone="subtle">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tc-admin-frame-subtle rounded-[20px] px-4 py-4">
                  <p className="text-sm leading-6 text-[color:var(--muted)]">
                    No content families are visible yet. Create the first content entry to begin building this library.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Link href="/admin/content/new" className="tc-button-primary text-center">
                Create content entry
              </Link>
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => {
                  setSearchValue("");
                  setContentStatus("");
                  setContentAccessType("");
                  setContentFamily("");
                  setContentMediumId("");
                }}
              >
                Clear filters
              </button>
            </div>

            <div className="tc-admin-stat mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Library health
              </p>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[color:var(--muted)]">Draft entries</span>
                  <span className="font-semibold text-[color:var(--brand)]">
                    {contentDraftCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[color:var(--muted)]">Featured entries</span>
                  <span className="font-semibold text-[color:var(--brand)]">
                    {contentFeaturedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[color:var(--muted)]">Published entries</span>
                  <span className="font-semibold text-[color:var(--brand)]">
                    {contentPublishedCount}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {initialTab === "notes" || !isContentListMode ? (
          <section
            className={[
              "tc-admin-frame rounded-[28px] p-5 md:p-6",
              initialTab === "notes" ? "xl:sticky xl:top-4 xl:h-fit" : "",
            ].join(" ")}
          >
          {initialTab === "notes" ? (
            <div className="grid gap-4">
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Note editor
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  {selectedNote ? `Update ${selectedNote.title}` : "Create a note"}
                </h2>
              </div>
              <AdminInput
                label="Title"
                value={noteForm.title}
                onChange={(event) =>
                  setNoteForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Slug"
                  value={noteForm.slug}
                  onChange={(event) =>
                    setNoteForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
                <AdminInput
                  label="Order index"
                  type="number"
                  value={noteForm.orderIndex}
                  onChange={(event) =>
                    setNoteForm((current) => ({ ...current, orderIndex: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminSelect
                  label="Subject"
                  value={noteForm.subjectId}
                  onChange={(event) =>
                    setNoteForm((current) => ({ ...current, subjectId: event.target.value }))
                  }
                >
                  <option value="">Select subject</option>
                  {taxonomy.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Medium"
                  value={noteForm.mediumId}
                  onChange={(event) =>
                    setNoteForm((current) => ({ ...current, mediumId: event.target.value }))
                  }
                >
                  <option value="">All mediums</option>
                  {taxonomy.mediums.map((medium) => (
                    <option key={medium.id} value={medium.id}>
                      {medium.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <AdminInput
                label="Topic IDs"
                hint="Comma-separated topic IDs. Use this when a note spans more than one topic."
                value={noteForm.topicIds}
                onChange={(event) =>
                  setNoteForm((current) => ({ ...current, topicIds: event.target.value }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <AdminSelect
                  label="Access type"
                  value={noteForm.accessType}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      accessType: event.target.value as NoteAccessType,
                    }))
                  }
                >
                  {NOTE_ACCESS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  label="Preview pages"
                  type="number"
                  value={noteForm.previewPageCount}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      previewPageCount: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Full file asset ID"
                  value={noteForm.fullFileAssetId}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      fullFileAssetId: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Preview file asset ID"
                  value={noteForm.previewFileAssetId}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      previewFileAssetId: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Cover image asset ID"
                  value={noteForm.coverImageAssetId}
                  onChange={(event) =>
                    setNoteForm((current) => ({
                      ...current,
                      coverImageAssetId: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Page count"
                  type="number"
                  value={noteForm.pageCount}
                  onChange={(event) =>
                    setNoteForm((current) => ({ ...current, pageCount: event.target.value }))
                  }
                />
              </div>
              <AdminTextarea
                label="Short description"
                value={noteForm.shortDescription}
                onChange={(event) =>
                  setNoteForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Description"
                value={noteForm.description}
                onChange={(event) =>
                  setNoteForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageNotes || noteSaveMutation.isPending}
                  onClick={() => noteSaveMutation.mutate()}
                >
                  {noteSaveMutation.isPending ? "Saving..." : selectedNote ? "Save note" : "Create note"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!selectedNote || !canPublishNotes || notePublishMutation.isPending}
                  onClick={() =>
                    notePublishMutation.mutate(
                      selectedNote?.status === "PUBLISHED" ? "unpublish" : "publish",
                    )
                  }
                >
                  {selectedNote?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {isContentEditorMode && !isCreatingContent && !selectedContent ? (
                <EmptyState
                  eyebrow="Structured content"
                  title="That content record could not be found."
                  description="Return to the content library and choose another record."
                />
              ) : (
                <>
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Structured content editor
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  {selectedContentId || contentId
                    ? "Update structured content"
                    : "Create structured content"}
                </h2>
              </div>
              <AdminFontTextField
                label="Title"
                storage="html"
                value={contentForm.title}
                onChange={(value) =>
                  setContentForm((current) => ({ ...current, title: value }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Slug"
                  value={contentForm.slug}
                  onChange={(event) =>
                    setContentForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
                <AdminInput
                  label="Order index"
                  type="number"
                  value={contentForm.orderIndex}
                  onChange={(event) =>
                    setContentForm((current) => ({ ...current, orderIndex: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminSelect
                  label="Family"
                  value={contentForm.family}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      family: event.target.value as ContentFamily,
                    }))
                  }
                >
                  {CONTENT_FAMILY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Format"
                  value={contentForm.format}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      format: event.target.value as ContentFormat,
                    }))
                  }
                >
                  {CONTENT_FORMAT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminSelect
                  label="Visibility"
                  value={contentForm.visibility}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      visibility: event.target.value as StructuredContentFormState["visibility"],
                    }))
                  }
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="AUTHENTICATED">AUTHENTICATED</option>
                  <option value="INTERNAL">INTERNAL</option>
                </AdminSelect>
                <AdminSelect
                  label="Access type"
                  value={contentForm.accessType}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      accessType: event.target.value as ContentAccessType,
                    }))
                  }
                >
                  {CONTENT_ACCESS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="tc-form-label">Exam tracks</span>
                    <span className="text-xs leading-5 text-[color:var(--muted)]">
                      Choose the tracks that should surface this content.
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {taxonomy.examTracks.map((track) => (
                      <label
                        key={track.id}
                        className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={contentForm.examTrackIds.includes(track.id)}
                          onChange={(event) =>
                            setContentForm((current) => ({
                              ...current,
                              examTrackIds: event.target.checked
                                ? [...current.examTrackIds, track.id]
                                : current.examTrackIds.filter((id) => id !== track.id),
                            }))
                          }
                        />
                        <span>{track.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="tc-form-label">Mediums</span>
                    <span className="text-xs leading-5 text-[color:var(--muted)]">
                      Select one or more study mediums for this entry.
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {taxonomy.mediums.map((medium) => (
                      <label
                        key={medium.id}
                        className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={contentForm.mediumIds.includes(medium.id)}
                          onChange={(event) =>
                            setContentForm((current) => ({
                              ...current,
                              mediumIds: event.target.checked
                                ? [...current.mediumIds, medium.id]
                                : current.mediumIds.filter((id) => id !== medium.id),
                            }))
                          }
                        />
                        <span>{medium.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Cover image asset ID"
                  value={contentForm.coverImageAssetId}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      coverImageAssetId: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Reading time minutes"
                  type="number"
                  value={contentForm.readingTimeMinutes}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      readingTimeMinutes: event.target.value,
                    }))
                  }
                />
              </div>
              <AdminInput
                label="Featured order index"
                hint="Optional. Use this if the entry should be featured."
                type="number"
                value={contentForm.featuredOrderIndex}
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    featuredOrderIndex: event.target.value,
                  }))
                }
              />
              <AdminFontTextField
                label="Excerpt"
                multiline
                preserveParagraphs
                rows={4}
                storage="html"
                value={contentForm.excerpt}
                onChange={(value) =>
                  setContentForm((current) => ({ ...current, excerpt: value }))
                }
              />
              <AdminRichHtmlField
                label="Lesson body"
                hint="Write the student-facing lesson content here. Formatting and Marathi font hints will be preserved."
                minHeight="18rem"
                value={contentForm.bodyHtml}
                onChange={(value) =>
                  setContentForm((current) => ({ ...current, bodyHtml: value }))
                }
              />
              <AdminKeyValueEditor
                hint="Optional content metadata such as month, lesson level, or campaign tags."
                label="Metadata"
                rows={contentForm.metaRows}
                onChange={(rows) =>
                  setContentForm((current) => ({ ...current, metaRows: rows }))
                }
              />
              <AdminAttachmentsEditor
                hint="Attach worksheets, PDFs, or supporting downloads in the order students should see them."
                label="Attachments"
                rows={contentForm.attachments}
                onChange={(rows) =>
                  setContentForm((current) => ({
                    ...current,
                    attachments: rows,
                  }))
                }
              />
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageContent || contentSaveMutation.isPending}
                  onClick={() => contentSaveMutation.mutate()}
                >
                  {contentSaveMutation.isPending
                    ? "Saving..."
                    : selectedContentId || contentId
                      ? "Save content"
                      : "Create content"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!(selectedContentId || contentId) || !canPublishContent || contentPublishMutation.isPending}
                  onClick={() =>
                    contentPublishMutation.mutate(
                      selectedContent?.status === "PUBLISHED" ? "unpublish" : "publish",
                    )
                  }
                >
                  {selectedContent?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!(selectedContentId || contentId) || !canPublishContent || contentPublishMutation.isPending}
                  onClick={() =>
                    contentPublishMutation.mutate(
                      selectedContent?.isFeatured ? "unfeature" : "feature",
                    )
                  }
                >
                  {selectedContent?.isFeatured ? "Remove feature" : "Feature entry"}
                </button>
              </div>
                </>
              )}
            </div>
          )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
