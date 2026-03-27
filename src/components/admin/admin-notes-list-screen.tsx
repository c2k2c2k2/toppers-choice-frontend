"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  formatAdminDateTime,
  getApiErrorMessage,
  listAdminNotes,
  publishAdminNote,
  unpublishAdminNote,
  type Note,
  type NoteAccessType,
  type NoteStatus,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminSelect } from "@/components/admin/admin-form-field";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

const PAGE_SIZE = 10;
const NOTE_STATUS_OPTIONS: Array<NoteStatus | ""> = ["", "DRAFT", "PUBLISHED", "ARCHIVED"];
const NOTE_ACCESS_OPTIONS: Array<NoteAccessType | ""> = [
  "",
  "FREE",
  "PREVIEWABLE_PREMIUM",
  "PREMIUM_ONLY",
];

export function AdminNotesListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const taxonomy = useAdminTaxonomyReferenceData();
  const authSession = useAuthSession();
  const canReadNotes = authSession.hasPermission("content.notes.read");
  const canManageNotes = authSession.hasPermission("content.notes.manage");
  const canPublishNotes = authSession.hasPermission("content.notes.publish");
  const [searchValue, setSearchValue] = useState("");
  const [status, setStatus] = useState<NoteStatus | "">("");
  const [accessType, setAccessType] = useState<NoteAccessType | "">("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const notesQuery = useAuthenticatedQuery({
    enabled: canReadNotes,
    queryFn: (accessToken) =>
      listAdminNotes(accessToken, {
        accessType: accessType || undefined,
        search: searchValue.trim() || undefined,
        status: status || undefined,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
      }),
    queryKey: adminQueryKeys.notes({
      accessType: accessType || null,
      search: searchValue.trim() || null,
      status: status || null,
      subjectId: subjectId || null,
      topicId: topicId || null,
    }),
    staleTime: 15_000,
  });

  const publishMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        action: "publish" | "unpublish";
        noteId: string;
      },
      accessToken,
    ) =>
      input.action === "publish"
        ? publishAdminNote(input.noteId, accessToken)
        : unpublishAdminNote(input.noteId, accessToken),
    onSuccess: async (_, variables) => {
      setMessage(
        variables.action === "publish" ? "Note published." : "Note moved back to draft.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notes"],
      });
    },
  });

  const topicOptions = subjectId ? taxonomy.topicsBySubjectId[subjectId] ?? [] : [];
  const paginatedRows = useMemo(() => {
    const items = notesQuery.data?.items ?? [];
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [notesQuery.data?.items, page]);

  if (!canReadNotes) {
    return (
      <EmptyState
        eyebrow="Notes"
        title="This session cannot open the notes workspace."
        description="Ask an administrator to grant note read access for this account."
      />
    );
  }

  if (notesQuery.isLoading || taxonomy.isLoading) {
    return (
      <LoadingState
        title="Preparing notes workspace"
        description="Loading the note catalog, subjects, topics, and publish controls."
      />
    );
  }

  if (notesQuery.isError) {
    return (
      <ErrorState
        title="The notes workspace could not load."
        description="We couldn't finish loading the note listing and filters."
        onRetry={() => void notesQuery.refetch()}
      />
    );
  }

  const allRows = notesQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Content management"
        title="Notes"
        description="Keep the notes workflow simple: filter the library here, then open a separate page to create or edit one note at a time."
        actions={
          canManageNotes ? (
            <Link href="/admin/notes/new" className="tc-button-primary">
              Create note
            </Link>
          ) : null
        }
      />

      <AdminRouteTabs
        activeHref="/admin/notes"
        items={[
          {
            href: "/admin/notes",
            label: "Notes",
            description: "Published and draft note records.",
          },
          {
            href: "/admin/content",
            label: "Guidance content",
            description: "Articles, lessons, and public/student guidance content.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={(value) => {
          setPage(1);
          setSearchValue(value);
        }}
        searchPlaceholder="Search notes by title, slug, or summary"
        resultSummary={`${allRows.length} notes found`}
      >
        <AdminSelect
          label="Status"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as NoteStatus | "");
          }}
        >
          <option value="">All statuses</option>
          {NOTE_STATUS_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Access"
          value={accessType}
          onChange={(event) => {
            setPage(1);
            setAccessType(event.target.value as NoteAccessType | "");
          }}
        >
          <option value="">All access types</option>
          {NOTE_ACCESS_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Subject"
          value={subjectId}
          onChange={(event) => {
            setPage(1);
            setSubjectId(event.target.value);
            setTopicId("");
          }}
        >
          <option value="">All subjects</option>
          {taxonomy.subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Topic"
          value={topicId}
          onChange={(event) => {
            setPage(1);
            setTopicId(event.target.value);
          }}
        >
          <option value="">All topics</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </AdminSelect>
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

      {publishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            publishMutation.error,
            "The note publication status could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      <AdminDataTable
        rows={paginatedRows}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/notes/${row.id}`)}
        emptyState={
          <EmptyState
            eyebrow="Notes"
            title="No notes matched these filters."
            description="Clear one or two filters, or create the first note for this subject."
          />
        }
        columns={[
          {
            header: "Note",
            render: (row: Note) => (
              <div>
                <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{row.slug}</p>
              </div>
            ),
          },
          {
            header: "Subject",
            render: (row: Note) => (
              <div>
                <p>{row.subject.name}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {row.topics.length > 0
                    ? row.topics.map((topic) => topic.name).join(", ")
                    : "Subject-level note"}
                </p>
              </div>
            ),
          },
          {
            header: "Access",
            className: "w-52",
            render: (row: Note) => (
              <div>
                <p>{row.accessType.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {row.pageCount} pages
                </p>
              </div>
            ),
          },
          {
            header: "Status",
            className: "w-36",
            render: (row: Note) => row.status,
          },
          {
            header: "Updated",
            className: "w-44",
            render: (row: Note) => formatAdminDateTime(row.updatedAt),
          },
          {
            header: "Actions",
            className: "w-60",
            render: (row: Note) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/admin/notes/${row.id}`);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canPublishNotes || publishMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMessage(null);
                    publishMutation.mutate({
                      action: row.status === "PUBLISHED" ? "unpublish" : "publish",
                      noteId: row.id,
                    });
                  }}
                >
                  {row.status === "PUBLISHED" ? "Move to draft" : "Publish"}
                </button>
              </div>
            ),
          },
        ]}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={allRows.length}
      />
    </div>
  );
}
