"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/lib/auth";
import {
  createAdminEnglishSpeakingTopic,
  deleteAdminEnglishSpeakingTopic,
  formatAdminDateTime,
  getApiErrorMessage,
  listAdminEnglishSpeakingTopics,
} from "@/lib/admin";
import { parseImportedEnglishSpeakingTopicDraft } from "@/lib/admin/english-speaking-helpers";
import type {
  AdminEnglishSpeakingTopicSummary,
  EnglishSpeakingTopicAccessType,
  EnglishSpeakingTopicStatus,
  EnglishSpeakingTopicVisibility,
} from "@/lib/english-speaking";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminDialogShell } from "@/components/admin/admin-dialog-shell";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type ReadinessFilter = "ALL" | "NEEDS_AUDIO" | "READY";

const STATUS_OPTIONS: Array<EnglishSpeakingTopicStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];
const ACCESS_OPTIONS: Array<EnglishSpeakingTopicAccessType | "ALL"> = [
  "ALL",
  "FREE",
  "PREMIUM",
];
const VISIBILITY_OPTIONS: Array<EnglishSpeakingTopicVisibility | "ALL"> = [
  "ALL",
  "AUTHENTICATED",
  "PUBLIC",
  "INTERNAL",
];
const READINESS_OPTIONS: ReadinessFilter[] = ["ALL", "READY", "NEEDS_AUDIO"];

function getTopicStatusTone(status: EnglishSpeakingTopicStatus) {
  return status === "PUBLISHED"
    ? "live"
    : status === "ARCHIVED"
      ? "danger"
      : "warning";
}

function getAccessTone(accessType: EnglishSpeakingTopicAccessType) {
  return accessType === "PREMIUM" ? "warning" : "info";
}

function getReadinessTone(topic: AdminEnglishSpeakingTopicSummary) {
  return topic.isReadyToPublish ? "live" : "warning";
}

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

export function AdminEnglishSpeakingListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<EnglishSpeakingTopicStatus | "ALL">(
    "ALL",
  );
  const [accessFilter, setAccessFilter] = useState<
    EnglishSpeakingTopicAccessType | "ALL"
  >("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<
    EnglishSpeakingTopicVisibility | "ALL"
  >("ALL");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("ALL");
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importTitleOverride, setImportTitleOverride] = useState("");

  const listQuery = useAuthenticatedQuery({
    queryFn: (accessToken) =>
      listAdminEnglishSpeakingTopics(accessToken, {
        accessType: accessFilter === "ALL" ? undefined : accessFilter,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        visibility: visibilityFilter === "ALL" ? undefined : visibilityFilter,
      }),
    queryKey: adminQueryKeys.englishSpeaking({
      accessType: accessFilter === "ALL" ? null : accessFilter,
      search: null,
      status: statusFilter === "ALL" ? null : statusFilter,
      visibility: visibilityFilter === "ALL" ? null : visibilityFilter,
    }),
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const importMutation = useAuthenticatedMutation({
    mutationFn: async (
      variables: {
        importValue: string;
        titleOverride: string;
      },
      accessToken,
    ) => {
      const imported = parseImportedEnglishSpeakingTopicDraft(variables.importValue);
      const title = variables.titleOverride.trim() || imported.title;

      if (!title) {
        throw new Error(
          "The imported JSON did not include a document title. Add a title before importing.",
        );
      }

      return createAdminEnglishSpeakingTopic(
        {
          sentences: imported.sentences,
          title,
        },
        accessToken,
      );
    },
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "The import could not be completed."),
      );
    },
    onSuccess: async (topic) => {
      setIsImportDialogOpen(false);
      setImportValue("");
      setImportTitleOverride("");
      setPageMessage("Imported topic created. Continue editing on the next page.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });
      router.push(`/admin/english-speaking/${encodeURIComponent(topic.id)}`);
    },
  });

  const deleteMutation = useAuthenticatedMutation({
    mutationFn: (topicId: string, accessToken) =>
      deleteAdminEnglishSpeakingTopic(topicId, accessToken),
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "The topic could not be deleted."),
      );
    },
    onSuccess: async (response) => {
      setPageMessage(response.message);
      await queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });
    },
  });

  const filteredItems = useMemo(() => {
    const items = listQuery.data?.items ?? [];

    return items.filter((topic) => {
      if (readinessFilter === "READY") {
        return topic.isReadyToPublish;
      }

      if (readinessFilter === "NEEDS_AUDIO") {
        return !topic.isReadyToPublish;
      }

      return true;
    });
  }, [listQuery.data?.items, readinessFilter]);

  const publishedCount = listQuery.data?.items.filter(
    (topic) => topic.status === "PUBLISHED",
  ).length ?? 0;
  const readyCount = listQuery.data?.items.filter(
    (topic) => topic.isReadyToPublish,
  ).length ?? 0;
  const totalSentences = listQuery.data?.items.reduce(
    (total, topic) => total + topic.sentenceCount,
    0,
  ) ?? 0;

  async function handleDeleteTopic(topic: AdminEnglishSpeakingTopicSummary) {
    const confirmed = window.confirm(
      `Delete "${topic.title}"? This removes the topic and any generated audio linked to it.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync(topic.id);
  }

  function resetFilters() {
    setAccessFilter("ALL");
    setReadinessFilter("ALL");
    setStatusFilter("ALL");
    setVisibilityFilter("ALL");
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        title="English speaking topics could not load."
        description="The admin topic library did not finish loading from the backend."
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  if (listQuery.isLoading || !listQuery.data) {
    return (
      <LoadingState
        title="Preparing English speaking topics"
        description="Loading the topic library, readiness state, and publish status."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Audio-first content"
        title="English speaking"
        description="Keep the admin flow calm: review the full topic library here, then open a dedicated page to create, edit, preview, finalize, and publish one topic at a time."
        actions={
          <>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => setIsImportDialogOpen(true)}
            >
              Import JSON
            </button>
            <Link href="/admin/english-speaking/new" className="tc-button-primary">
              New topic
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <WorkspaceStatCard
          label="Topics"
          value={listQuery.data.total}
          detail="All English speaking topic shells currently available to the admin team."
        />
        <WorkspaceStatCard
          label="Ready"
          value={readyCount}
          detail="Topics where every sentence already has current finalized audio in all three languages."
        />
        <WorkspaceStatCard
          label="Sentence load"
          value={totalSentences}
          detail={`${publishedCount} published topic${publishedCount === 1 ? "" : "s"} are already visible to students.`}
        />
      </section>

      <section className="tc-admin-frame-subtle rounded-[24px] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Filters
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Narrow the topic list without opening the editor.
            </h2>
          </div>
          <div className="tc-admin-toolbar">
            <button
              type="button"
              className="tc-button-secondary"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminSelect
            label="Status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as EnglishSpeakingTopicStatus | "ALL")
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : option}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Access"
            value={accessFilter}
            onChange={(event) =>
              setAccessFilter(
                event.target.value as EnglishSpeakingTopicAccessType | "ALL",
              )
            }
          >
            {ACCESS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All access tiers" : option}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Visibility"
            value={visibilityFilter}
            onChange={(event) =>
              setVisibilityFilter(
                event.target.value as EnglishSpeakingTopicVisibility | "ALL",
              )
            }
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All visibility levels" : option}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Readiness"
            value={readinessFilter}
            onChange={(event) =>
              setReadinessFilter(event.target.value as ReadinessFilter)
            }
          >
            {READINESS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL"
                  ? "All topics"
                  : option === "READY"
                    ? "Ready to publish"
                    : "Needs audio work"}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="mt-4 border-t border-[rgba(0,30,64,0.08)] pt-4">
          <p className="text-sm text-[color:var(--muted)]">
            Showing {filteredItems.length} of {listQuery.data.total} topic
            {listQuery.data.total === 1 ? "" : "s"}.
          </p>
        </div>
      </section>

      {pageMessage ? <AdminInlineNotice>{pageMessage}</AdminInlineNotice> : null}

      <AdminDataTable
        columns={[
          {
            header: "Topic",
            render: (topic) => (
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand)]">
                    {topic.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                    {topic.slug}
                  </p>
                </div>
                {topic.description ? (
                  <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                    {topic.description}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            header: "Status",
            render: (topic) => (
              <div className="flex flex-wrap gap-2">
                <AdminToneBadge
                  tone={getTopicStatusTone(topic.status)}
                  label={topic.status}
                />
                <AdminToneBadge
                  tone={getReadinessTone(topic)}
                  label={`${topic.readySentenceCount}/${topic.sentenceCount} ready`}
                />
              </div>
            ),
          },
          {
            header: "Access",
            render: (topic) => (
              <div className="flex flex-wrap gap-2">
                <AdminToneBadge
                  tone={getAccessTone(topic.accessType)}
                  label={topic.accessType}
                />
                <AdminVisibilityBadge visibility={topic.visibility} />
              </div>
            ),
          },
          {
            header: "Updated",
            render: (topic) => (
              <div className="space-y-1 text-sm text-[color:var(--muted)]">
                <p>{formatAdminDateTime(topic.updatedAt)}</p>
                <p>Published: {formatAdminDateTime(topic.publishedAt)}</p>
              </div>
            ),
          },
          {
            className: "w-[15rem]",
            header: "Actions",
            render: (topic) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/english-speaking/${encodeURIComponent(topic.id)}`}
                  className="tc-button-secondary"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={deleteMutation.isPending}
                  onClick={() => void handleDeleteTopic(topic)}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        emptyState={
          <section className="tc-admin-frame rounded-[24px] p-6">
            <EmptyState
              eyebrow="English speaking"
              title="No topics match the current filters."
              description="Clear the filters or create a fresh topic to restart the authoring flow."
              ctaHref="/admin/english-speaking/new"
              ctaLabel="Create topic"
            />
          </section>
        }
        getRowId={(topic) => topic.id}
        rows={filteredItems}
      />

      <AdminDialogShell
        isOpen={isImportDialogOpen}
        onClose={() => {
          if (importMutation.isPending) {
            return;
          }

          setIsImportDialogOpen(false);
        }}
        title="Import topic from JSON"
        description="Paste the reference JSON in a separate popup so the library page stays focused on browsing and filtering."
        actions={
          <>
            <button
              type="button"
              className="tc-button-secondary"
              disabled={importMutation.isPending}
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tc-button-primary"
              disabled={importMutation.isPending}
              onClick={() =>
                void importMutation.mutateAsync({
                  importValue,
                  titleOverride: importTitleOverride,
                })
              }
            >
              {importMutation.isPending ? "Importing..." : "Create draft topic"}
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <AdminInput
            label="Title override"
            hint="Optional. Use this when the pasted JSON is an array without a document title."
            value={importTitleOverride}
            onChange={(event) => setImportTitleOverride(event.target.value)}
          />
          <AdminTextarea
            label="Topic JSON"
            className="min-h-64"
            hint="Supports either a full object with document_title + data or a direct sentence array."
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
          />
          <AdminInlineNotice>
            Import creates a draft topic first. You can review the sentences, generate previews, and publish from the dedicated editor page.
          </AdminInlineNotice>
        </div>
      </AdminDialogShell>
    </div>
  );
}
