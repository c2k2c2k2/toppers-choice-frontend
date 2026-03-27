"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminNote,
  formatAdminDateTime,
  getAdminNote,
  getApiErrorMessage,
  publishAdminNote,
  updateAdminNote,
  unpublishAdminNote,
  type CreateNoteInput,
  type Note,
  type NoteAccessType,
  type UpdateNoteInput,
} from "@/lib/admin";
import { AdminFileAssetField } from "@/components/admin/admin-file-asset-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminNoteIndexManager } from "@/components/admin/admin-note-index-manager";
import {
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

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
  topicIds: string[];
}

const EMPTY_FORM: NoteFormState = {
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
  topicIds: [],
};

type AdminTaxonomyReferenceData = ReturnType<typeof useAdminTaxonomyReferenceData>;

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function buildFormState(note: Note | null): NoteFormState {
  if (!note) {
    return EMPTY_FORM;
  }

  return {
    accessType: note.accessType,
    coverImageAssetId: readStringValue(note.coverImageAssetId),
    description: readStringValue(note.description),
    fullFileAssetId: readStringValue(note.fullFileAssetId),
    mediumId: readStringValue(note.mediumId),
    orderIndex: String(note.orderIndex),
    pageCount: String(note.pageCount),
    previewFileAssetId: readStringValue(note.previewFileAssetId),
    previewPageCount: note.previewPageCount ? String(note.previewPageCount) : "",
    shortDescription: readStringValue(note.shortDescription),
    slug: readStringValue(note.slug),
    subjectId: readStringValue(note.subjectId),
    title: readStringValue(note.title),
    topicIds: note.topics.map((topic) => topic.id),
  };
}

function buildInitialForm(note: Note | null, defaultSubjectId: string): NoteFormState {
  if (note) {
    return buildFormState(note);
  }

  return {
    ...EMPTY_FORM,
    subjectId: defaultSubjectId,
  };
}

export function AdminNoteEditorScreen({
  noteId,
}: Readonly<{
  noteId?: string;
}>) {
  const authSession = useAuthSession();
  const taxonomy = useAdminTaxonomyReferenceData();
  const isEdit = Boolean(noteId);
  const canReadNotes = authSession.hasPermission("content.notes.read");
  const canManageNotes = authSession.hasPermission("content.notes.manage");
  const canPublishNotes = authSession.hasPermission("content.notes.publish");

  const noteQuery = useAuthenticatedQuery({
    enabled: Boolean(noteId) && canReadNotes,
    queryFn: (accessToken) => getAdminNote(noteId!, accessToken),
    queryKey: noteId ? ["admin", "note", noteId] : ["admin", "note", "new"],
    staleTime: 15_000,
  });

  if (!canReadNotes && isEdit) {
    return (
      <EmptyState
        eyebrow="Notes"
        title="This session cannot open the note editor."
        description="Ask an administrator to grant note access to this account."
      />
    );
  }

  if ((noteQuery.isLoading && isEdit) || taxonomy.isLoading) {
    return (
      <LoadingState
        title={isEdit ? "Loading note editor" : "Preparing note editor"}
        description="Loading the note details, taxonomy, and file pickers."
      />
    );
  }

  if (noteQuery.isError && isEdit) {
    return (
      <ErrorState
        title="The note editor could not load."
        description="We couldn't finish loading this note record."
        onRetry={() => void noteQuery.refetch()}
      />
    );
  }

  return (
    <AdminNoteEditorForm
      key={
        noteId
          ? `${noteId}:${noteQuery.data?.updatedAt ?? "initial"}`
          : `new:${taxonomy.subjects[0]?.id ?? "unassigned"}`
      }
      canManageNotes={canManageNotes}
      canPublishNotes={canPublishNotes}
      isEdit={isEdit}
      note={noteQuery.data ?? null}
      noteId={noteId}
      taxonomy={taxonomy}
    />
  );
}

function AdminNoteEditorForm({
  canManageNotes,
  canPublishNotes,
  isEdit,
  note,
  noteId,
  taxonomy,
}: Readonly<{
  canManageNotes: boolean;
  canPublishNotes: boolean;
  isEdit: boolean;
  note: Note | null;
  noteId?: string;
  taxonomy: AdminTaxonomyReferenceData;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentNote, setCurrentNote] = useState<Note | null>(note);
  const [form, setForm] = useState<NoteFormState>(() =>
    buildInitialForm(note, taxonomy.subjects[0]?.id ?? ""),
  );
  const [message, setMessage] = useState<string | null>(null);

  const selectedSubjectTopics = useMemo(
    () => (form.subjectId ? taxonomy.topicsBySubjectId[form.subjectId] ?? [] : []),
    [form.subjectId, taxonomy.topicsBySubjectId],
  );

  const saveMutation = useAuthenticatedMutation({
    mutationFn: (_unused: void, accessToken: string) => {
      const payload: CreateNoteInput | UpdateNoteInput = {
        accessType: form.accessType,
        coverImageAssetId: form.coverImageAssetId.trim() || undefined,
        description: form.description.trim() || undefined,
        fullFileAssetId: form.fullFileAssetId.trim(),
        mediumId: form.mediumId.trim() || undefined,
        orderIndex: parseOptionalNumber(form.orderIndex),
        pageCount: Number(form.pageCount),
        previewFileAssetId: form.previewFileAssetId.trim() || undefined,
        previewPageCount:
          form.accessType === "PREVIEWABLE_PREMIUM"
            ? parseOptionalNumber(form.previewPageCount)
            : undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        slug: form.slug.trim() || undefined,
        subjectId: form.subjectId,
        title: form.title.trim(),
        topicIds: form.topicIds,
      };

      return isEdit && noteId
        ? updateAdminNote(noteId, payload, accessToken)
        : createAdminNote(payload as CreateNoteInput, accessToken);
    },
    onSuccess: async (savedNote) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notes"],
      });

      if (!isEdit) {
        router.replace(`/admin/notes/${savedNote.id}`);
        return;
      }

      setMessage("Note saved.");
      setCurrentNote(savedNote);
      setForm(buildFormState(savedNote));
      await queryClient.invalidateQueries({
        queryKey: ["admin", "note", savedNote.id],
      });
    },
  });

  const publishMutation = useAuthenticatedMutation({
    mutationFn: (action: "publish" | "unpublish", accessToken: string) =>
      action === "publish"
        ? publishAdminNote(noteId!, accessToken)
        : unpublishAdminNote(noteId!, accessToken),
    onSuccess: async (savedNote, action) => {
      setMessage(action === "publish" ? "Note published." : "Note moved back to draft.");
      setCurrentNote(savedNote);
      setForm(buildFormState(savedNote));
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notes"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "note", savedNote.id],
      });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Content management"
        title={isEdit ? "Edit note" : "Create note"}
        description="Use this page for one note at a time: details, file links, preview setup, and the student-facing index."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/notes" className="tc-button-secondary">
              Back to notes
            </Link>
            {isEdit ? (
              <button
                type="button"
                className="tc-button-secondary"
                disabled={!canPublishNotes || publishMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  publishMutation.mutate(
                    currentNote?.status === "PUBLISHED" ? "unpublish" : "publish",
                  );
                }}
              >
                {currentNote?.status === "PUBLISHED" ? "Move to draft" : "Publish"}
              </button>
            ) : null}
            <button
              type="button"
              className="tc-button-primary"
              disabled={
                !canManageNotes ||
                !form.title.trim() ||
                !form.subjectId ||
                !form.fullFileAssetId.trim() ||
                !form.pageCount.trim() ||
                saveMutation.isPending
              }
              onClick={() => {
                setMessage(null);
                saveMutation.mutate();
              }}
            >
              {saveMutation.isPending ? "Saving..." : isEdit ? "Save note" : "Create note"}
            </button>
          </div>
        }
      />

      <AdminRouteTabs
        activeHref="/admin/notes"
        items={[
          {
            href: "/admin/notes",
            label: "Notes",
            description: "Return to the note listing.",
          },
          {
            href: "/admin/content",
            label: "Guidance content",
            description: "Public and student content records.",
          },
        ]}
      />

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

      {saveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(saveMutation.error, "The note could not be saved.")}
        </AdminInlineNotice>
      ) : null}

      {publishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            publishMutation.error,
            "The note publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      {isEdit && currentNote ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Status</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentNote.status}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Updated</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {formatAdminDateTime(currentNote.updatedAt)}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Access</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentNote.accessType.replaceAll("_", " ")}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Pages</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentNote.pageCount}
            </p>
          </div>
        </div>
      ) : null}

      <section className="tc-card rounded-[28px] p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminInput
            label="Title"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Indian Polity Marathon Notes"
          />
          <AdminInput
            label="Slug"
            value={form.slug}
            onChange={(event) =>
              setForm((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="indian-polity-marathon-notes"
          />
          <AdminInput
            label="Order"
            type="number"
            min={0}
            value={form.orderIndex}
            onChange={(event) =>
              setForm((current) => ({ ...current, orderIndex: event.target.value }))
            }
            placeholder="10"
          />
          <AdminSelect
            label="Subject"
            value={form.subjectId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subjectId: event.target.value,
                topicIds: [],
              }))
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
            value={form.mediumId}
            onChange={(event) =>
              setForm((current) => ({ ...current, mediumId: event.target.value }))
            }
          >
            <option value="">All mediums</option>
            {taxonomy.mediums.map((medium) => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Access type"
            value={form.accessType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                accessType: event.target.value as NoteAccessType,
              }))
            }
          >
            <option value="FREE">FREE</option>
            <option value="PREVIEWABLE_PREMIUM">PREVIEWABLE PREMIUM</option>
            <option value="PREMIUM_ONLY">PREMIUM ONLY</option>
          </AdminSelect>
          <AdminInput
            label="Total pages"
            type="number"
            min={1}
            value={form.pageCount}
            onChange={(event) =>
              setForm((current) => ({ ...current, pageCount: event.target.value }))
            }
            placeholder="248"
          />
          <AdminInput
            label="Preview pages"
            type="number"
            min={1}
            value={form.previewPageCount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                previewPageCount: event.target.value,
              }))
            }
            placeholder="3"
            disabled={form.accessType !== "PREVIEWABLE_PREMIUM"}
          />
        </div>

        <div className="mt-5">
          <p className="tc-form-label">Topics</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSubjectTopics.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Select a subject first to attach topics.
              </p>
            ) : (
              selectedSubjectTopics.map((topic) => {
                const isSelected = form.topicIds.includes(topic.id);

                return (
                  <button
                    key={topic.id}
                    type="button"
                    className="tc-filter-chip"
                    data-active={isSelected}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        topicIds: isSelected
                          ? current.topicIds.filter((id) => id !== topic.id)
                          : [...current.topicIds, topic.id],
                      }))
                    }
                  >
                    {topic.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <AdminTextarea
            label="Short description"
            value={form.shortDescription}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shortDescription: event.target.value,
              }))
            }
            placeholder="Short summary for listings and cards."
          />
          <AdminTextarea
            label="Full description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Detailed note summary for admins and students."
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminFileAssetField
          label="Main PDF"
          description="Upload or link the full note PDF students will read after access is granted."
          emptyDescription="No main PDF is linked yet."
          accept="application/pdf"
          accessLevel="PROTECTED"
          purpose="NOTE_PDF"
          value={form.fullFileAssetId}
          onChange={(assetId) =>
            setForm((current) => ({ ...current, fullFileAssetId: assetId }))
          }
        />
        <AdminFileAssetField
          label="Preview PDF"
          description="Optional preview file for premium notes that allow sample reading."
          emptyDescription="Add this only when preview access should be available."
          accept="application/pdf"
          accessLevel="PROTECTED"
          purpose="NOTE_PDF"
          value={form.previewFileAssetId}
          onChange={(assetId) =>
            setForm((current) => ({ ...current, previewFileAssetId: assetId }))
          }
        />
      </div>

      <AdminFileAssetField
        label="Cover image"
        description="Optional note cover for cards and student listing screens."
        emptyDescription="This note currently has no cover image."
        accept="image/*"
        accessLevel="PROTECTED"
        purpose="GENERIC_IMAGE"
        value={form.coverImageAssetId}
        onChange={(assetId) =>
          setForm((current) => ({ ...current, coverImageAssetId: assetId }))
        }
      />

      <AdminNoteIndexManager
        noteId={noteId ?? null}
        pageCount={Number(form.pageCount) || 1}
        canManage={canManageNotes}
      />
    </div>
  );
}
