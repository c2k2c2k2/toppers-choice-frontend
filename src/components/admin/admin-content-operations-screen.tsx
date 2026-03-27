"use client";

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
  safeJsonParse,
  safeJsonParseArray,
  stringifyJsonInput,
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
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

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
  attachmentsJson: string;
  bodyJson: string;
  coverImageAssetId: string;
  examTrackIds: string;
  excerpt: string;
  family: ContentFamily;
  featuredOrderIndex: string;
  format: ContentFormat;
  mediumIds: string;
  metaJson: string;
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
  attachmentsJson: "",
  bodyJson: "",
  coverImageAssetId: "",
  examTrackIds: "",
  excerpt: "",
  family: "CAREER_GUIDANCE",
  featuredOrderIndex: "",
  format: "ARTICLE",
  mediumIds: "",
  metaJson: "",
  orderIndex: "",
  readingTimeMinutes: "",
  slug: "",
  title: "",
  visibility: "PUBLIC",
};

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
    attachmentsJson: stringifyJsonInput(
      content.attachments.map((attachment) => ({
        fileAssetId: attachment.fileAssetId,
        label: attachment.label,
        orderIndex: attachment.orderIndex,
      })),
    ),
    bodyJson: stringifyJsonInput(content.bodyJson),
    coverImageAssetId:
      typeof content.coverImage?.id === "string" ? content.coverImage.id : "",
    examTrackIds: content.examTracks.map((track) => track.id).join(", "),
    excerpt: typeof content.excerpt === "string" ? content.excerpt : "",
    family: content.family,
    featuredOrderIndex:
      typeof content.featuredOrderIndex === "number"
        ? String(content.featuredOrderIndex)
        : "",
    format: content.format,
    mediumIds: content.mediums.map((medium) => medium.id).join(", "),
    metaJson: stringifyJsonInput(content.metaJson),
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
}: Readonly<{
  initialTab: ContentWorkspaceTab;
}>) {
  const authSession = useAuthSession();
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
    enabled: initialTab === "content" && canReadContent && Boolean(selectedContentId),
    queryFn: (accessToken) => getAdminContent(selectedContentId ?? "", accessToken),
    queryKey: ["admin", "content", "detail", selectedContentId ?? "new"],
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
    }
  }, [initialTab]);

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
      const input = {
        accessType: contentForm.accessType,
        attachments: (safeJsonParseArray(contentForm.attachmentsJson, {
          allowEmpty: true,
          label: "Attachments",
        }) ?? []) as Array<{
          fileAssetId: string;
          label?: string;
          orderIndex?: number;
        }>,
        bodyJson: safeJsonParse(contentForm.bodyJson, {
          label: "Body JSON",
        }) as Record<string, never>,
        coverImageAssetId: contentForm.coverImageAssetId.trim() || undefined,
        examTrackIds: parseIdListInput(contentForm.examTrackIds),
        excerpt: contentForm.excerpt.trim() || undefined,
        family: contentForm.family,
        format: contentForm.format,
        mediumIds: parseIdListInput(contentForm.mediumIds),
        metaJson: safeJsonParse(contentForm.metaJson, {
          allowEmpty: true,
          label: "Meta JSON",
        }) as Record<string, never> | undefined,
        orderIndex: parseOptionalInteger(contentForm.orderIndex),
        readingTimeMinutes: parseOptionalInteger(contentForm.readingTimeMinutes),
        slug: contentForm.slug.trim() || undefined,
        title: contentForm.title.trim(),
        visibility: contentForm.visibility,
      };

      if (!input.title) {
        throw new Error("A title is required.");
      }

      if (selectedContentId) {
        return updateAdminContent(selectedContentId, input, accessToken);
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
    },
  });

  const contentPublishMutation = useAuthenticatedMutation({
    mutationFn: async (action: "publish" | "unpublish" | "feature" | "unfeature", accessToken) => {
      if (!selectedContentId) {
        throw new Error("Select a structured content record first.");
      }

      if (action === "publish") {
        return publishAdminContent(selectedContentId, accessToken, {});
      }

      if (action === "unpublish") {
        return unpublishAdminContent(selectedContentId, accessToken);
      }

      if (action === "feature") {
        return featureAdminContent(
          selectedContentId,
          {
            featuredOrderIndex: parseOptionalInteger(contentForm.featuredOrderIndex),
          },
          accessToken,
        );
      }

      return unfeatureAdminContent(selectedContentId, accessToken);
    },
    onSuccess: async () => {
      setMessage("Structured content state updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "content"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "content", "detail", selectedContentId ?? "new"],
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
    (initialTab === "content" && (contentQuery.isLoading || contentDetailQuery.isLoading))
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
    (initialTab === "content" && (contentQuery.error || contentDetailQuery.error))
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

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Authoring"
        title={
          initialTab === "notes"
            ? "Notes"
            : "Structured content"
        }
        description={
          initialTab === "notes"
            ? "Create, update, and publish note records for students."
            : "Manage guidance, English speaking, current affairs, and monthly updates from one editor."
        }
        actions={
          <>
            <button
              type="button"
              className="tc-button-primary"
              disabled={!activeCanManage}
              onClick={() => {
                setMessage(null);
                if (initialTab === "notes") {
                  setSelectedNoteId(null);
                  setNoteForm(EMPTY_NOTE_FORM_STATE);
                } else {
                  setSelectedContentId(null);
                  setContentForm(EMPTY_CONTENT_FORM_STATE);
                }
              }}
            >
              New {initialTab === "notes" ? "note" : "content entry"}
            </button>
          </>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
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
              selectedRowId={selectedContentId}
              onRowClick={(row) => setSelectedContentId(row.id)}
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
                      <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
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

        <section className="tc-card rounded-[28px] p-6">
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
              <div>
                <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                  Structured content editor
                </p>
                <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                  {selectedContentId ? "Update structured content" : "Create structured content"}
                </h2>
              </div>
              <AdminInput
                label="Title"
                value={contentForm.title}
                onChange={(event) =>
                  setContentForm((current) => ({ ...current, title: event.target.value }))
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
                <AdminInput
                  label="Exam track IDs"
                  value={contentForm.examTrackIds}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      examTrackIds: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Medium IDs"
                  value={contentForm.mediumIds}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      mediumIds: event.target.value,
                    }))
                  }
                />
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
              <AdminTextarea
                label="Excerpt"
                value={contentForm.excerpt}
                onChange={(event) =>
                  setContentForm((current) => ({ ...current, excerpt: event.target.value }))
                }
              />
              <AdminTextarea
                label="Body JSON"
                value={contentForm.bodyJson}
                onChange={(event) =>
                  setContentForm((current) => ({ ...current, bodyJson: event.target.value }))
                }
              />
              <AdminTextarea
                label="Meta JSON"
                value={contentForm.metaJson}
                onChange={(event) =>
                  setContentForm((current) => ({ ...current, metaJson: event.target.value }))
                }
              />
              <AdminTextarea
                label="Attachments JSON"
                hint='Example: [{"fileAssetId":"asset-id","label":"Worksheet","orderIndex":10}]'
                value={contentForm.attachmentsJson}
                onChange={(event) =>
                  setContentForm((current) => ({
                    ...current,
                    attachmentsJson: event.target.value,
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
                    : selectedContentId
                      ? "Save content"
                      : "Create content"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!selectedContentId || !canPublishContent || contentPublishMutation.isPending}
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
                  disabled={!selectedContentId || !canPublishContent || contentPublishMutation.isPending}
                  onClick={() =>
                    contentPublishMutation.mutate(
                      selectedContent?.isFeatured ? "unfeature" : "feature",
                    )
                  }
                >
                  {selectedContent?.isFeatured ? "Remove feature" : "Feature entry"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
