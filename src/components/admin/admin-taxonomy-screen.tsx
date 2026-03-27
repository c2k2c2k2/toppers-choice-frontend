"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminExamTrack,
  createAdminMedium,
  createAdminSubject,
  createAdminTag,
  createAdminTopic,
  formatAdminDateTime,
  getApiErrorMessage,
  reorderAdminExamTracks,
  reorderAdminMediums,
  reorderAdminSubjects,
  reorderAdminTags,
  reorderAdminTopics,
  updateAdminExamTrack,
  updateAdminMedium,
  updateAdminSubject,
  updateAdminTag,
  updateAdminTopic,
  listAdminExamTracks,
  listAdminMediums,
  listAdminSubjects,
  listAdminTags,
  listAdminTopics,
  type ExamTrack,
  type Medium,
  type Subject,
  type Tag,
  type Topic,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type TaxonomyTab = "examTracks" | "mediums" | "subjects" | "topics" | "tags";
type TaxonomyRecord = ExamTrack | Medium | Subject | Topic | Tag;

interface TaxonomyFormState {
  code: string;
  description: string;
  examTrackId: string;
  isActive: boolean;
  name: string;
  orderIndex: string;
  parentId: string;
  shortName: string;
  slug: string;
  subjectId: string;
  visibility: ExamTrack["visibility"];
}

const TAB_ORDER: TaxonomyTab[] = [
  "examTracks",
  "mediums",
  "subjects",
  "topics",
  "tags",
];

const TAB_LABELS: Record<TaxonomyTab, string> = {
  examTracks: "Exam tracks",
  mediums: "Mediums",
  subjects: "Subjects",
  topics: "Topics",
  tags: "Tags",
};

const EMPTY_FORM_STATE: TaxonomyFormState = {
  code: "",
  description: "",
  examTrackId: "",
  isActive: true,
  name: "",
  orderIndex: "",
  parentId: "",
  shortName: "",
  slug: "",
  subjectId: "",
  visibility: "PUBLIC",
};

function sortByOrderIndex<Row extends { orderIndex: number; name: string }>(rows: Row[]) {
  return [...rows].sort((left, right) => {
    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return left.name.localeCompare(right.name);
  });
}

function buildFormState(record: TaxonomyRecord | null): TaxonomyFormState {
  if (!record) {
    return EMPTY_FORM_STATE;
  }

  return {
    code: record.code,
    description: typeof record.description === "string" ? record.description : "",
    examTrackId: "examTrackId" in record ? record.examTrackId : "",
    isActive: record.isActive,
    name: record.name,
    orderIndex: String(record.orderIndex),
    parentId: "parentId" in record && typeof record.parentId === "string" ? record.parentId : "",
    shortName: "shortName" in record && typeof record.shortName === "string" ? record.shortName : "",
    slug: record.slug,
    subjectId: "subjectId" in record ? record.subjectId : "",
    visibility: record.visibility,
  };
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function AdminTaxonomyScreen() {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const canRead = authSession.hasPermission("academics.taxonomy.read");
  const canManage = authSession.hasPermission("academics.taxonomy.manage");
  const [activeTab, setActiveTab] = useState<TaxonomyTab>("examTracks");
  const [examTrackFilter, setExamTrackFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TaxonomyFormState>(EMPTY_FORM_STATE);
  const [message, setMessage] = useState<string | null>(null);

  const examTracksQuery = useAuthenticatedQuery({
    enabled: canRead,
    queryFn: listAdminExamTracks,
    queryKey: adminQueryKeys.taxonomy("examTracks"),
    staleTime: 60_000,
  });
  const mediumsQuery = useAuthenticatedQuery({
    enabled: canRead,
    queryFn: listAdminMediums,
    queryKey: adminQueryKeys.taxonomy("mediums"),
    staleTime: 60_000,
  });
  const subjectsQuery = useAuthenticatedQuery({
    enabled: canRead,
    queryFn: (accessToken) =>
      listAdminSubjects(accessToken, {
        examTrackId: examTrackFilter || undefined,
      }),
    queryKey: adminQueryKeys.taxonomy("subjects", {
      examTrackId: examTrackFilter || null,
    }),
    staleTime: 60_000,
  });
  const topicsQuery = useAuthenticatedQuery({
    enabled: canRead,
    queryFn: (accessToken) =>
      listAdminTopics(accessToken, {
        subjectId: subjectFilter || undefined,
      }),
    queryKey: adminQueryKeys.taxonomy("topics", {
      subjectId: subjectFilter || null,
    }),
    staleTime: 60_000,
  });
  const tagsQuery = useAuthenticatedQuery({
    enabled: canRead,
    queryFn: listAdminTags,
    queryKey: adminQueryKeys.taxonomy("tags"),
    staleTime: 60_000,
  });

  const rows = useMemo<TaxonomyRecord[]>(() => {
    const loweredSearch = searchValue.trim().toLowerCase();
    const source =
      activeTab === "examTracks"
        ? sortByOrderIndex(examTracksQuery.data ?? [])
        : activeTab === "mediums"
          ? sortByOrderIndex(mediumsQuery.data ?? [])
          : activeTab === "subjects"
            ? sortByOrderIndex(subjectsQuery.data ?? [])
            : activeTab === "topics"
              ? sortByOrderIndex(topicsQuery.data ?? [])
              : sortByOrderIndex(tagsQuery.data ?? []);

    if (!loweredSearch) {
      return source;
    }

    return source.filter((record) => {
      return [
        record.name,
        record.code,
        record.slug,
        typeof record.description === "string" ? record.description : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(loweredSearch);
    });
  }, [
    activeTab,
    examTracksQuery.data,
    mediumsQuery.data,
    searchValue,
    subjectsQuery.data,
    tagsQuery.data,
    topicsQuery.data,
  ]);

  const selectedRecord = useMemo(() => {
    if (!rows.length) {
      return null;
    }

    return rows.find((record) => record.id === selectedId) ?? rows[0];
  }, [rows, selectedId]);

  useEffect(() => {
    setFormState(buildFormState(selectedRecord));
  }, [selectedRecord]);

  useEffect(() => {
    setSelectedId(null);
    setMessage(null);
  }, [activeTab, examTrackFilter, subjectFilter]);

  const hasBlockingError =
    canRead &&
    (examTracksQuery.error ||
      mediumsQuery.error ||
      subjectsQuery.error ||
      topicsQuery.error ||
      tagsQuery.error);

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const sharedInput = {
        name: formState.name.trim(),
        code: formState.code.trim() || undefined,
        slug: formState.slug.trim() || undefined,
        description: formState.description.trim() || undefined,
        visibility: formState.visibility,
        orderIndex: parseOptionalInteger(formState.orderIndex),
        isActive: formState.isActive,
      };

      if (!sharedInput.name) {
        throw new Error("Name is required.");
      }

      if (activeTab === "examTracks") {
        const input = {
          ...sharedInput,
          shortName: formState.shortName.trim() || undefined,
        };

        if (selectedRecord && "shortName" in selectedRecord) {
          return updateAdminExamTrack(selectedRecord.id, input, accessToken);
        }

        return createAdminExamTrack(input, accessToken);
      }

      if (activeTab === "mediums") {
        if (selectedRecord && !("examTrackId" in selectedRecord)) {
          return updateAdminMedium(selectedRecord.id, sharedInput, accessToken);
        }

        return createAdminMedium(sharedInput, accessToken);
      }

      if (activeTab === "subjects") {
        const input = {
          ...sharedInput,
          examTrackId: formState.examTrackId,
        };

        if (!input.examTrackId) {
          throw new Error("An exam track is required for subjects.");
        }

        if (selectedRecord && "examTrackId" in selectedRecord) {
          return updateAdminSubject(selectedRecord.id, input, accessToken);
        }

        return createAdminSubject(input, accessToken);
      }

      if (activeTab === "topics") {
        const input = {
          ...sharedInput,
          subjectId: formState.subjectId,
          parentId: formState.parentId.trim() || undefined,
        };

        if (!input.subjectId) {
          throw new Error("A subject is required for topics.");
        }

        if (selectedRecord && "subjectId" in selectedRecord) {
          return updateAdminTopic(selectedRecord.id, input, accessToken);
        }

        return createAdminTopic(input, accessToken);
      }

      if (selectedRecord && !("subjectId" in selectedRecord) && !("examTrackId" in selectedRecord)) {
        return updateAdminTag(selectedRecord.id, sharedInput, accessToken);
      }

      return createAdminTag(sharedInput, accessToken);
    },
    onSuccess: async (record) => {
      setSelectedId(record.id);
      setMessage(`${TAB_LABELS[activeTab]} saved successfully.`);
      await invalidateCurrentTabQueries();
    },
  });

  const reorderMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const orderedIds = rows.map((record) => record.id);

      if (activeTab === "examTracks") {
        return reorderAdminExamTracks({ orderedIds }, accessToken);
      }

      if (activeTab === "mediums") {
        return reorderAdminMediums({ orderedIds }, accessToken);
      }

      if (activeTab === "subjects") {
        return reorderAdminSubjects({ orderedIds }, accessToken);
      }

      if (activeTab === "topics") {
        return reorderAdminTopics({ orderedIds }, accessToken);
      }

      return reorderAdminTags({ orderedIds }, accessToken);
    },
    onSuccess: async () => {
      setMessage(`Saved visible ${TAB_LABELS[activeTab].toLowerCase()} order.`);
      await invalidateCurrentTabQueries();
    },
  });

  async function invalidateCurrentTabQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.taxonomy("examTracks"),
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.taxonomy("mediums"),
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin", "taxonomy", "subjects"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin", "taxonomy", "topics"],
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.taxonomy("tags"),
      }),
    ]);
  }

  if (!canRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="Taxonomy visibility is locked for this session."
        description="This admin account does not currently expose taxonomy read permissions, so the catalog mapping workspace cannot be loaded."
      />
    );
  }

  if (
    examTracksQuery.isLoading ||
    mediumsQuery.isLoading ||
    subjectsQuery.isLoading ||
    topicsQuery.isLoading ||
    tagsQuery.isLoading
  ) {
    return (
      <LoadingState
        title="Loading taxonomy workspace"
        description="Pulling exam tracks, mediums, subjects, topics, and tags from the backend taxonomy contracts."
      />
    );
  }

  if (hasBlockingError) {
    return (
      <ErrorState
        title="The taxonomy workspace could not be loaded."
        description="One or more catalog reference queries failed, so the editor cannot safely render."
        onRetry={() => {
          void examTracksQuery.refetch();
          void mediumsQuery.refetch();
          void subjectsQuery.refetch();
          void topicsQuery.refetch();
          void tagsQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Catalog control"
        title="Taxonomy now runs through one shared admin workspace."
        description="Exam tracks, mediums, subjects, topics, and tags all stay on top of the same permission-aware CRUD patterns so later notes, content, and assessment authoring can trust these reference records."
        actions={
          <>
            {canManage ? (
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => {
                  setSelectedId(null);
                  setFormState(EMPTY_FORM_STATE);
                  setMessage(null);
                }}
              >
                New {TAB_LABELS[activeTab].slice(0, -1)}
              </button>
            ) : null}
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => reorderMutation.mutate()}
              disabled={!canManage || reorderMutation.isPending || rows.length === 0}
            >
              {reorderMutation.isPending ? "Saving order..." : "Persist visible order"}
            </button>
          </>
        }
      />

      <section className="tc-glass rounded-[24px] p-4">
        <div className="flex flex-wrap gap-2">
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{
                background:
                  activeTab === tab ? "rgba(0, 51, 102, 0.12)" : "rgba(255, 255, 255, 0.72)",
                color: activeTab === tab ? "var(--brand)" : "var(--muted)",
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </section>

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={`Search ${TAB_LABELS[activeTab].toLowerCase()} by name, code, slug, or description`}
        resultSummary={`${rows.length} ${TAB_LABELS[activeTab].toLowerCase()} visible in the current workspace.`}
      >
        {activeTab === "subjects" ? (
          <label className="tc-form-field min-w-[14rem]">
            <span className="tc-form-label">Exam track</span>
            <select
              value={examTrackFilter}
              onChange={(event) => setExamTrackFilter(event.target.value)}
              className="tc-input"
            >
              <option value="">All exam tracks</option>
              {sortByOrderIndex(examTracksQuery.data ?? []).map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {activeTab === "topics" ? (
          <label className="tc-form-field min-w-[14rem]">
            <span className="tc-form-label">Subject</span>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="tc-input"
            >
              <option value="">All subjects</option>
              {sortByOrderIndex(subjectsQuery.data ?? []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {saveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(saveMutation.error, "The taxonomy record could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {reorderMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(reorderMutation.error, "The visible order could not be saved.")}
        </AdminInlineNotice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <section className="space-y-4">
          <AdminDataTable
            rows={rows}
            getRowId={(row) => row.id}
            selectedRowId={selectedRecord?.id ?? null}
            onRowClick={(row) => setSelectedId(row.id)}
            emptyState={
              <EmptyState
                eyebrow="Taxonomy"
                title={`No ${TAB_LABELS[activeTab].toLowerCase()} match the current view.`}
                description="Try broadening the filters or create a new record to begin this catalog layer."
              />
            }
            columns={[
              {
                header: TAB_LABELS[activeTab].slice(0, -1),
                render: (row) => (
                  <div className="space-y-1">
                    <p className="font-semibold text-[color:var(--brand)]">{row.name}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {row.code} · {row.slug}
                    </p>
                  </div>
                ),
              },
              {
                header: "Scope",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <AdminVisibilityBadge visibility={row.visibility} />
                    <AdminToneBadge
                      tone={row.isActive ? "live" : "warning"}
                      label={row.isActive ? "Active" : "Inactive"}
                    />
                  </div>
                ),
              },
              {
                header: "Order",
                render: (row) => <span className="tc-code-chip">{row.orderIndex}</span>,
              },
              {
                header: "Linked To",
                render: (row) => (
                  <p className="text-sm text-[color:var(--muted)]">
                    {"examTrackId" in row
                      ? row.examTrackId
                      : "subjectId" in row
                        ? `${row.subjectId}${row.parentId ? ` · parent ${row.parentId}` : ""}`
                        : "Global"}
                  </p>
                ),
              },
              {
                header: "Updated",
                render: (row) => (
                  <p className="text-sm text-[color:var(--muted)]">
                    {formatAdminDateTime(row.updatedAt)}
                  </p>
                ),
              },
            ]}
          />
        </section>

        <section className="tc-card rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                {selectedRecord ? "Edit record" : "Create record"}
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                {selectedRecord
                  ? `Update ${selectedRecord.name}`
                  : `New ${TAB_LABELS[activeTab].slice(0, -1)}`}
              </h2>
              <p className="tc-muted mt-3 text-sm leading-6">
                Shared catalog fields stay consistent across the taxonomy tree so later modules can resolve references without frontend-side shape drift.
              </p>
            </div>
            {selectedRecord ? (
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => {
                  setSelectedId(null);
                  setFormState(EMPTY_FORM_STATE);
                  setMessage(null);
                }}
              >
                Create new
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            <AdminInput
              label="Name"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Code"
                value={formState.code}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, code: event.target.value }))
                }
              />
              <AdminInput
                label="Slug"
                value={formState.slug}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </div>
            {"examTracks" === activeTab ? (
              <AdminInput
                label="Short name"
                value={formState.shortName}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, shortName: event.target.value }))
                }
              />
            ) : null}
            <AdminTextarea
              label="Description"
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({ ...current, description: event.target.value }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <AdminSelect
                label="Visibility"
                value={formState.visibility}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    visibility: event.target.value as ExamTrack["visibility"],
                  }))
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="AUTHENTICATED">Authenticated</option>
                <option value="INTERNAL">Internal</option>
              </AdminSelect>
              <AdminInput
                label="Order index"
                type="number"
                value={formState.orderIndex}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, orderIndex: event.target.value }))
                }
              />
            </div>

            {activeTab === "subjects" ? (
              <AdminSelect
                label="Exam track"
                value={formState.examTrackId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, examTrackId: event.target.value }))
                }
              >
                <option value="">Select exam track</option>
                {sortByOrderIndex(examTracksQuery.data ?? []).map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </AdminSelect>
            ) : null}

            {activeTab === "topics" ? (
              <>
                <AdminSelect
                  label="Subject"
                  value={formState.subjectId}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      subjectId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select subject</option>
                  {sortByOrderIndex(subjectsQuery.data ?? []).map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Parent topic"
                  value={formState.parentId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, parentId: event.target.value }))
                  }
                >
                  <option value="">Root topic</option>
                  {sortByOrderIndex(
                    (topicsQuery.data ?? []).filter((topic) => topic.id !== selectedRecord?.id),
                  ).map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </AdminSelect>
              </>
            ) : null}

            <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Keep this record active for downstream catalog use.
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                className="tc-button-primary"
                onClick={() => saveMutation.mutate()}
                disabled={!canManage || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : selectedRecord
                    ? "Save changes"
                    : "Create record"}
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => setFormState(buildFormState(selectedRecord))}
              >
                Reset form
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
