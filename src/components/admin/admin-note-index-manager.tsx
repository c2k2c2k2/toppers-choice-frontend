"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import type { MarathiEncodedFontKey } from "@/lib/marathi";
import {
  createAdminNoteIndexEntry,
  deleteAdminNoteIndexEntry,
  getApiErrorMessage,
  listAdminNoteIndexEntries,
  updateAdminNoteIndexEntry,
  type AdminNoteIndexEntry,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field";
import { MarathiText } from "@/components/primitives/marathi-text";
import { EmptyState } from "@/components/primitives/empty-state";

interface NoteIndexFormState {
  indentLevel: string;
  orderIndex: string;
  pageNumber: string;
  serialLabel: string;
  title: string;
  titleFontHint: "" | MarathiEncodedFontKey;
}

const EMPTY_FORM: NoteIndexFormState = {
  indentLevel: "0",
  orderIndex: "",
  pageNumber: "1",
  serialLabel: "",
  title: "",
  titleFontHint: "",
};

function buildEmptyForm(pageCount: number): NoteIndexFormState {
  return {
    ...EMPTY_FORM,
    pageNumber: String(Math.max(1, Math.min(pageCount || 1, 1))),
  };
}

function buildFormState(entry: AdminNoteIndexEntry): NoteIndexFormState {
  return {
    indentLevel: String(entry.indentLevel),
    orderIndex: String(entry.orderIndex),
    pageNumber: String(entry.pageNumber),
    serialLabel: entry.serialLabel ?? "",
    title: entry.title,
    titleFontHint: entry.titleFontHint ?? "",
  };
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function AdminNoteIndexManager({
  canManage,
  noteId,
  pageCount,
}: Readonly<{
  canManage: boolean;
  noteId: string | null;
  pageCount: number;
}>) {
  const queryClient = useQueryClient();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteIndexFormState>(() => buildEmptyForm(pageCount));
  const [message, setMessage] = useState<string | null>(null);

  const indexQuery = useAuthenticatedQuery({
    enabled: Boolean(noteId),
    queryFn: (accessToken) => listAdminNoteIndexEntries(noteId!, accessToken),
    queryKey: noteId ? adminQueryKeys.noteIndex(noteId) : ["admin", "notes", "index", "new"],
    staleTime: 15_000,
  });

  const createMutation = useAuthenticatedMutation({
    mutationFn: (_unused: void, accessToken: string) =>
      createAdminNoteIndexEntry(
        noteId!,
        {
          indentLevel: parseOptionalNumber(form.indentLevel),
          orderIndex: parseOptionalNumber(form.orderIndex),
          pageNumber: Number(form.pageNumber),
          serialLabel: form.serialLabel.trim() || undefined,
          title: form.title.trim(),
          titleFontHint: form.titleFontHint || undefined,
        },
        accessToken,
      ),
    onSuccess: async () => {
      setForm(buildEmptyForm(pageCount));
      setMessage("Index entry added.");
      if (noteId) {
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.noteIndex(noteId),
        });
      }
    },
  });

  const updateMutation = useAuthenticatedMutation({
    mutationFn: (_unused: void, accessToken: string) =>
      updateAdminNoteIndexEntry(
        noteId!,
        editingEntryId!,
        {
          indentLevel: parseOptionalNumber(form.indentLevel),
          orderIndex: parseOptionalNumber(form.orderIndex),
          pageNumber: Number(form.pageNumber),
          serialLabel: form.serialLabel.trim() || undefined,
          title: form.title.trim(),
          titleFontHint: form.titleFontHint || undefined,
        },
        accessToken,
      ),
    onSuccess: async () => {
      setEditingEntryId(null);
      setForm(buildEmptyForm(pageCount));
      setMessage("Index entry updated.");
      if (noteId) {
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.noteIndex(noteId),
        });
      }
    },
  });

  const deleteMutation = useAuthenticatedMutation({
    mutationFn: (entry: AdminNoteIndexEntry, accessToken: string) =>
      deleteAdminNoteIndexEntry(noteId!, entry.id, accessToken),
    onSuccess: async () => {
      setEditingEntryId(null);
      setForm(buildEmptyForm(pageCount));
      setMessage("Index entry removed.");
      if (noteId) {
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.noteIndex(noteId),
        });
      }
    },
  });

  if (!noteId) {
    return (
      <section className="tc-card rounded-[28px] p-6">
        <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
          Note index
        </p>
        <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
          Save the note first
        </h2>
        <p className="tc-muted mt-3 text-sm leading-7">
          The index is tied to a specific note record, so create the note first and then add
          serial numbers, topic names, and page references here.
        </p>
      </section>
    );
  }

  return (
    <section className="tc-card rounded-[28px] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Note index
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Topic-wise page map
          </h2>
          <p className="tc-muted mt-3 text-sm leading-7">
            Build the chapter or topic index students will use inside the note reader.
          </p>
        </div>
        <span className="tc-code-chip">Total pages: {pageCount}</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-6">
        <AdminInput
          label="Serial no."
          value={form.serialLabel}
          onChange={(event) =>
            setForm((current) => ({ ...current, serialLabel: event.target.value }))
          }
          placeholder="1.1"
        />
        <AdminInput
          label="Topic name"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
          placeholder="Directive Principles"
        />
        <AdminInput
          label="Page no."
          type="number"
          min={1}
          max={pageCount}
          value={form.pageNumber}
          onChange={(event) =>
            setForm((current) => ({ ...current, pageNumber: event.target.value }))
          }
        />
        <AdminSelect
          label="Title font"
          value={form.titleFontHint}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              titleFontHint: event.target.value as NoteIndexFormState["titleFontHint"],
            }))
          }
        >
          <option value="">Unicode / auto</option>
          <option value="shree-dev">Shree Dev</option>
          <option value="surekh">Surekh / Sulekha</option>
        </AdminSelect>
        <AdminInput
          label="Indent level"
          type="number"
          min={0}
          value={form.indentLevel}
          onChange={(event) =>
            setForm((current) => ({ ...current, indentLevel: event.target.value }))
          }
        />
        <AdminInput
          label="Order"
          type="number"
          min={0}
          value={form.orderIndex}
          onChange={(event) =>
            setForm((current) => ({ ...current, orderIndex: event.target.value }))
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="tc-button-primary"
          disabled={
            !canManage ||
            !form.title.trim() ||
            !form.pageNumber.trim() ||
            createMutation.isPending ||
            updateMutation.isPending
          }
          onClick={() => {
            setMessage(null);
            if (editingEntryId) {
              updateMutation.mutate();
              return;
            }

            createMutation.mutate();
          }}
        >
          {editingEntryId
            ? updateMutation.isPending
              ? "Saving..."
              : "Update entry"
            : createMutation.isPending
              ? "Adding..."
              : "Add entry"}
        </button>
        {editingEntryId ? (
          <button
            type="button"
            className="tc-button-secondary"
            onClick={() => {
              setEditingEntryId(null);
              setForm(buildEmptyForm(pageCount));
            }}
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="mt-4">
          <AdminInlineNotice tone="success">{message}</AdminInlineNotice>
        </div>
      ) : null}

      {createMutation.error ? (
        <div className="mt-4">
          <AdminInlineNotice tone="warning">
            {getApiErrorMessage(createMutation.error, "The index entry could not be added.")}
          </AdminInlineNotice>
        </div>
      ) : null}

      {updateMutation.error ? (
        <div className="mt-4">
          <AdminInlineNotice tone="warning">
            {getApiErrorMessage(updateMutation.error, "The index entry could not be updated.")}
          </AdminInlineNotice>
        </div>
      ) : null}

      {deleteMutation.error ? (
        <div className="mt-4">
          <AdminInlineNotice tone="warning">
            {getApiErrorMessage(deleteMutation.error, "The index entry could not be removed.")}
          </AdminInlineNotice>
        </div>
      ) : null}

      <div className="mt-6">
        <AdminDataTable
          rows={indexQuery.data?.items ?? []}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              eyebrow="Note index"
              title="No index entries yet."
              description="Start with chapter headings, important topics, and the page number where each one begins."
            />
          }
          columns={[
            {
              header: "Topic",
              render: (row) => (
                <div>
                  <div
                    className="font-semibold text-[color:var(--brand)]"
                    style={{ paddingLeft: `${row.indentLevel * 0.85}rem` }}
                  >
                    {row.serialLabel ? <span>{row.serialLabel} </span> : null}
                    <MarathiText
                      as="span"
                      text={row.title}
                      fontHint={row.titleFontHint}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Order {row.orderIndex}
                  </p>
                </div>
              ),
            },
            {
              header: "Page",
              className: "w-28",
              render: (row) => row.pageNumber,
            },
            {
              header: "Actions",
              className: "w-48",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => {
                      setEditingEntryId(row.id);
                      setForm(buildFormState(row));
                      setMessage(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    disabled={!canManage || deleteMutation.isPending}
                    onClick={() => {
                      setMessage(null);
                      deleteMutation.mutate(row);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}
