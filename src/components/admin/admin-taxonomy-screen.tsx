"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { adminQueryKeys } from "@/lib/api/query-keys"
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth"
import {
  createAdminExamTrack,
  createAdminMedium,
  createAdminSubject,
  createAdminTag,
  createAdminTopic,
  formatAdminDateTime,
  getApiErrorMessage,
  listAdminExamTracks,
  listAdminMediums,
  listAdminSubjects,
  listAdminTags,
  listAdminTopics,
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
  type ExamTrack,
  type Medium,
  type Subject,
  type Tag,
  type Topic,
} from "@/lib/admin"
import {
  getAdminTaxonomyEditHref,
  getAdminTaxonomyEntityHref,
  getAdminTaxonomyNewHref,
  type AdminTaxonomyEntity,
} from "@/lib/admin/taxonomy-routes"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminFontTextField } from "@/components/admin/admin-font-text-field"
import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field"
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs"
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge"
import { EmptyState } from "@/components/primitives/empty-state"
import { ErrorState } from "@/components/primitives/error-state"
import { LoadingState } from "@/components/primitives/loading-state"

type TaxonomyManagementView = "list" | "editor"
type TaxonomyRecord = ExamTrack | Medium | Subject | Topic | Tag

interface TaxonomyFormState {
  code: string
  description: string
  examTrackId: string
  isActive: boolean
  name: string
  orderIndex: string
  parentId: string
  shortName: string
  slug: string
  subjectId: string
  visibility: ExamTrack["visibility"]
}

const ENTITY_LABELS: Record<AdminTaxonomyEntity, string> = {
  examTracks: "Exam tracks",
  mediums: "Mediums",
  subjects: "Subjects",
  topics: "Topics",
  tags: "Tags",
}

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
}

function sortByOrderIndex<Row extends { name: string; orderIndex: number }>(rows: Row[]) {
  return [...rows].sort((left, right) => {
    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex
    }

    return left.name.localeCompare(right.name)
  })
}

function buildFormState(record: TaxonomyRecord | null): TaxonomyFormState {
  if (!record) {
    return EMPTY_FORM_STATE
  }

  return {
    code: record.code,
    description: typeof record.description === "string" ? record.description : "",
    examTrackId: "examTrackId" in record ? record.examTrackId : "",
    isActive: record.isActive,
    name: record.name,
    orderIndex: String(record.orderIndex),
    parentId:
      "parentId" in record && typeof record.parentId === "string" ? record.parentId : "",
    shortName:
      "shortName" in record && typeof record.shortName === "string" ? record.shortName : "",
    slug: record.slug,
    subjectId: "subjectId" in record ? record.subjectId : "",
    visibility: record.visibility,
  }
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function moveRecord(ids: string[], targetId: string, direction: -1 | 1) {
  const currentIndex = ids.indexOf(targetId)

  if (currentIndex < 0) {
    return ids
  }

  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= ids.length) {
    return ids
  }

  const nextIds = [...ids]
  const [moved] = nextIds.splice(currentIndex, 1)
  nextIds.splice(nextIndex, 0, moved)
  return nextIds
}

function hasMatchingOrder(ids: string[], records: TaxonomyRecord[]) {
  if (ids.length !== records.length) {
    return false
  }

  const recordIds = new Set(records.map((record) => record.id))
  return ids.every((id) => recordIds.has(id))
}

function getTaxonomyRouteTabs() {
  return [
    {
      href: getAdminTaxonomyEntityHref("examTracks"),
      label: "Exam tracks",
      description: "Top-level prep tracks used across public and student flows.",
    },
    {
      href: getAdminTaxonomyEntityHref("mediums"),
      label: "Mediums",
      description: "Language or delivery mediums used in content filters.",
    },
    {
      href: getAdminTaxonomyEntityHref("subjects"),
      label: "Subjects",
      description: "Subjects nested under exam tracks.",
    },
    {
      href: getAdminTaxonomyEntityHref("topics"),
      label: "Topics",
      description: "Topic trees nested under subjects.",
    },
    {
      href: getAdminTaxonomyEntityHref("tags"),
      label: "Tags",
      description: "Reusable labels shared across content and assessments.",
    },
  ]
}

function getEntityLabel(entity: AdminTaxonomyEntity) {
  return ENTITY_LABELS[entity]
}

function getSingleEntityLabel(entity: AdminTaxonomyEntity) {
  return getEntityLabel(entity).slice(0, -1)
}

function getEntityRows(input: {
  entity: AdminTaxonomyEntity
  examTracks: ExamTrack[]
  mediums: Medium[]
  searchValue: string
  subjects: Subject[]
  tags: Tag[]
  topics: Topic[]
}) {
  const loweredSearch = input.searchValue.trim().toLowerCase()
  const source =
    input.entity === "examTracks"
      ? sortByOrderIndex(input.examTracks)
      : input.entity === "mediums"
        ? sortByOrderIndex(input.mediums)
        : input.entity === "subjects"
          ? sortByOrderIndex(input.subjects)
          : input.entity === "topics"
            ? sortByOrderIndex(input.topics)
            : sortByOrderIndex(input.tags)

  if (!loweredSearch) {
    return source as TaxonomyRecord[]
  }

  return source.filter((record) =>
    [
      record.name,
      record.code,
      record.slug,
      typeof record.description === "string" ? record.description : "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(loweredSearch),
  ) as TaxonomyRecord[]
}

function useTaxonomyQueries(input: {
  canRead: boolean
  examTrackFilter?: string
  subjectFilter?: string
}) {
  const examTracksQuery = useAuthenticatedQuery({
    enabled: input.canRead,
    queryFn: listAdminExamTracks,
    queryKey: adminQueryKeys.taxonomy("examTracks"),
    staleTime: 60_000,
  })
  const mediumsQuery = useAuthenticatedQuery({
    enabled: input.canRead,
    queryFn: listAdminMediums,
    queryKey: adminQueryKeys.taxonomy("mediums"),
    staleTime: 60_000,
  })
  const subjectsQuery = useAuthenticatedQuery({
    enabled: input.canRead,
    queryFn: (accessToken) =>
      listAdminSubjects(accessToken, {
        examTrackId: input.examTrackFilter || undefined,
      }),
    queryKey: adminQueryKeys.taxonomy("subjects", {
      examTrackId: input.examTrackFilter || null,
    }),
    staleTime: 60_000,
  })
  const topicsQuery = useAuthenticatedQuery({
    enabled: input.canRead,
    queryFn: (accessToken) =>
      listAdminTopics(accessToken, {
        subjectId: input.subjectFilter || undefined,
      }),
    queryKey: adminQueryKeys.taxonomy("topics", {
      subjectId: input.subjectFilter || null,
    }),
    staleTime: 60_000,
  })
  const tagsQuery = useAuthenticatedQuery({
    enabled: input.canRead,
    queryFn: listAdminTags,
    queryKey: adminQueryKeys.taxonomy("tags"),
    staleTime: 60_000,
  })

  return {
    examTracksQuery,
    mediumsQuery,
    subjectsQuery,
    tagsQuery,
    topicsQuery,
  }
}

async function invalidateTaxonomyQueries(queryClient: ReturnType<typeof useQueryClient>) {
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
  ])
}

function getRecordLinkText(record: TaxonomyRecord) {
  if ("examTrackId" in record) {
    return record.examTrackId
  }

  if ("subjectId" in record) {
    return `${record.subjectId}${record.parentId ? ` · parent ${record.parentId}` : ""}`
  }

  return "Global"
}

export function AdminTaxonomyScreen({
  entity,
  recordId,
  view = "list",
}: Readonly<{
  entity: AdminTaxonomyEntity
  recordId?: string
  view?: TaxonomyManagementView
}>) {
  if (view === "editor") {
    return <AdminTaxonomyEditorScreen entity={entity} recordId={recordId} />
  }

  return <AdminTaxonomyListScreen entity={entity} />
}

function AdminTaxonomyListScreen({
  entity,
}: Readonly<{
  entity: AdminTaxonomyEntity
}>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const authSession = useAuthSession()
  const canRead = authSession.hasPermission("academics.taxonomy.read")
  const canManage = authSession.hasPermission("academics.taxonomy.manage")
  const [examTrackFilter, setExamTrackFilter] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [orderIds, setOrderIds] = useState<string[]>([])

  const queries = useTaxonomyQueries({
    canRead,
    examTrackFilter: entity === "subjects" ? examTrackFilter : undefined,
    subjectFilter: entity === "topics" ? subjectFilter : undefined,
  })

  const hasBlockingError =
    canRead &&
    (queries.examTracksQuery.error ||
      queries.mediumsQuery.error ||
      queries.subjectsQuery.error ||
      queries.topicsQuery.error ||
      queries.tagsQuery.error)

  const rows = useMemo(
    () =>
      getEntityRows({
        entity,
        examTracks: queries.examTracksQuery.data ?? [],
        mediums: queries.mediumsQuery.data ?? [],
        searchValue,
        subjects: queries.subjectsQuery.data ?? [],
        tags: queries.tagsQuery.data ?? [],
        topics: queries.topicsQuery.data ?? [],
      }),
    [
      entity,
      queries.examTracksQuery.data,
      queries.mediumsQuery.data,
      queries.subjectsQuery.data,
      queries.tagsQuery.data,
      queries.topicsQuery.data,
      searchValue,
    ],
  )

  const defaultOrderIds = useMemo(
    () =>
      rows
        .slice()
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((record) => record.id),
    [rows],
  )
  const effectiveOrderIds = useMemo(
    () => (hasMatchingOrder(orderIds, rows) ? orderIds : defaultOrderIds),
    [defaultOrderIds, orderIds, rows],
  )
  const orderedRows = useMemo(() => {
    const lookup = new Map(effectiveOrderIds.map((id, index) => [id, index]))
    return [...rows].sort((left, right) => {
      const leftIndex = lookup.get(left.id)
      const rightIndex = lookup.get(right.id)
      if (leftIndex === undefined && rightIndex === undefined) {
        return left.orderIndex - right.orderIndex
      }
      if (leftIndex === undefined) {
        return 1
      }
      if (rightIndex === undefined) {
        return -1
      }
      return leftIndex - rightIndex
    })
  }, [effectiveOrderIds, rows])

  const reorderMutation = useAuthenticatedMutation({
    mutationFn: async (_unused: undefined, accessToken) => {
      const payload = {
        orderedIds: effectiveOrderIds,
      }

      if (entity === "examTracks") {
        return reorderAdminExamTracks(payload, accessToken)
      }

      if (entity === "mediums") {
        return reorderAdminMediums(payload, accessToken)
      }

      if (entity === "subjects") {
        return reorderAdminSubjects(payload, accessToken)
      }

      if (entity === "topics") {
        return reorderAdminTopics(payload, accessToken)
      }

      return reorderAdminTags(payload, accessToken)
    },
    onSuccess: async () => {
      setMessage(`Saved visible ${getEntityLabel(entity).toLowerCase()} order.`)
      await invalidateTaxonomyQueries(queryClient)
    },
  })

  if (!canRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This section is not available for this login."
        description="Ask an admin with taxonomy access to open this section or update your role."
      />
    )
  }

  if (
    queries.examTracksQuery.isLoading ||
    queries.mediumsQuery.isLoading ||
    queries.subjectsQuery.isLoading ||
    queries.topicsQuery.isLoading ||
    queries.tagsQuery.isLoading
  ) {
    return (
      <LoadingState
        title="Loading taxonomy workspace"
        description="Fetching tracks, mediums, subjects, topics, and tags."
      />
    )
  }

  if (hasBlockingError) {
    return (
      <ErrorState
        title="The taxonomy workspace could not load."
        description="We couldn't load the latest taxonomy data right now."
        onRetry={() => {
          void queries.examTracksQuery.refetch()
          void queries.mediumsQuery.refetch()
          void queries.subjectsQuery.refetch()
          void queries.topicsQuery.refetch()
          void queries.tagsQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Catalog control"
        title={getEntityLabel(entity)}
        description="Keep the taxonomy list focused on discovery and ordering here, then open a dedicated page to create or edit one record at a time."
        actions={
          <>
            <Link href={getAdminTaxonomyNewHref(entity)} className="tc-button-primary">
              New {getSingleEntityLabel(entity)}
            </Link>
            <button
              type="button"
              className="tc-button-secondary"
              disabled={!canManage || rows.length === 0 || reorderMutation.isPending}
              onClick={() => reorderMutation.mutate(undefined)}
            >
              {reorderMutation.isPending ? "Saving order..." : "Persist visible order"}
            </button>
          </>
        }
      />

      <AdminRouteTabs
        activeHref={getAdminTaxonomyEntityHref(entity)}
        items={getTaxonomyRouteTabs()}
      />

      <AdminFilterBar
        searchPlaceholder={`Search ${getEntityLabel(entity).toLowerCase()} by name, code, slug, or description`}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        resultSummary={`${rows.length} ${getEntityLabel(entity).toLowerCase()} visible in this view.`}
      >
        {entity === "subjects" ? (
          <AdminSelect
            label="Exam track"
            value={examTrackFilter}
            onChange={(event) => setExamTrackFilter(event.target.value)}
          >
            <option value="">All exam tracks</option>
            {sortByOrderIndex(queries.examTracksQuery.data ?? []).map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </AdminSelect>
        ) : null}
        {entity === "topics" ? (
          <AdminSelect
            label="Subject"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="">All subjects</option>
            {sortByOrderIndex(queries.subjectsQuery.data ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </AdminSelect>
        ) : null}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {reorderMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(reorderMutation.error, "The visible order could not be saved.")}
        </AdminInlineNotice>
      ) : null}

      <AdminDataTable
        rows={orderedRows}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(getAdminTaxonomyEditHref(entity, row.id))}
        emptyState={
          <EmptyState
            eyebrow="Taxonomy"
            title={`No ${getEntityLabel(entity).toLowerCase()} match the current view.`}
            description="Try broadening the filters or create a new record to begin this catalog layer."
          />
        }
        columns={[
          {
            header: getSingleEntityLabel(entity),
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
                  label={row.isActive ? "Active" : "Inactive"}
                  tone={row.isActive ? "live" : "warning"}
                />
              </div>
            ),
          },
          {
            header: "Order",
            render: (row) => <span className="tc-code-chip">{row.orderIndex}</span>,
          },
          {
            header: "Linked to",
            render: (row) => (
              <p className="text-sm text-[color:var(--muted)]">{getRecordLinkText(row)}</p>
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
          {
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link href={getAdminTaxonomyEditHref(entity, row.id)} className="tc-button-secondary">
                  Edit
                </Link>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canManage}
                  onClick={() =>
                    setOrderIds((current) =>
                      moveRecord(
                        hasMatchingOrder(current, rows) ? current : defaultOrderIds,
                        row.id,
                        -1,
                      ),
                    )
                  }
                >
                  Up
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canManage}
                  onClick={() =>
                    setOrderIds((current) =>
                      moveRecord(
                        hasMatchingOrder(current, rows) ? current : defaultOrderIds,
                        row.id,
                        1,
                      ),
                    )
                  }
                >
                  Down
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

function AdminTaxonomyEditorScreen({
  entity,
  recordId,
}: Readonly<{
  entity: AdminTaxonomyEntity
  recordId?: string
}>) {
  const authSession = useAuthSession()
  const canRead = authSession.hasPermission("academics.taxonomy.read")
  const queries = useTaxonomyQueries({
    canRead,
  })

  const hasBlockingError =
    canRead &&
    (queries.examTracksQuery.error ||
      queries.mediumsQuery.error ||
      queries.subjectsQuery.error ||
      queries.topicsQuery.error ||
      queries.tagsQuery.error)

  const rows = useMemo(
    () =>
      getEntityRows({
        entity,
        examTracks: queries.examTracksQuery.data ?? [],
        mediums: queries.mediumsQuery.data ?? [],
        searchValue: "",
        subjects: queries.subjectsQuery.data ?? [],
        tags: queries.tagsQuery.data ?? [],
        topics: queries.topicsQuery.data ?? [],
      }),
    [
      entity,
      queries.examTracksQuery.data,
      queries.mediumsQuery.data,
      queries.subjectsQuery.data,
      queries.tagsQuery.data,
      queries.topicsQuery.data,
    ],
  )

  const currentRecord = recordId ? rows.find((record) => record.id === recordId) ?? null : null

  if (!canRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This section is not available for this login."
        description="Ask an admin with taxonomy access to open this section or update your role."
      />
    )
  }

  if (
    queries.examTracksQuery.isLoading ||
    queries.mediumsQuery.isLoading ||
    queries.subjectsQuery.isLoading ||
    queries.topicsQuery.isLoading ||
    queries.tagsQuery.isLoading
  ) {
    return (
      <LoadingState
        title={`Loading ${getSingleEntityLabel(entity).toLowerCase()} editor`}
        description="Fetching taxonomy references and the selected record."
      />
    )
  }

  if (hasBlockingError) {
    return (
      <ErrorState
        title="The taxonomy editor could not load."
        description="We couldn't load the reference data for this record."
        onRetry={() => {
          void queries.examTracksQuery.refetch()
          void queries.mediumsQuery.refetch()
          void queries.subjectsQuery.refetch()
          void queries.topicsQuery.refetch()
          void queries.tagsQuery.refetch()
        }}
      />
    )
  }

  if (recordId && !currentRecord) {
    return (
      <EmptyState
        eyebrow="Taxonomy"
        title="This record could not be found."
        description="Return to the list and choose another record."
      />
    )
  }

  return (
    <AdminTaxonomyEditorForm
      key={currentRecord ? `${entity}:${currentRecord.id}:${currentRecord.updatedAt}` : `${entity}:new`}
      entity={entity}
      examTracks={queries.examTracksQuery.data ?? []}
      record={currentRecord}
      subjects={queries.subjectsQuery.data ?? []}
      topics={queries.topicsQuery.data ?? []}
    />
  )
}

function AdminTaxonomyEditorForm({
  entity,
  examTracks,
  record,
  subjects,
  topics,
}: Readonly<{
  entity: AdminTaxonomyEntity
  examTracks: ExamTrack[]
  record: TaxonomyRecord | null
  subjects: Subject[]
  topics: Topic[]
}>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const authSession = useAuthSession()
  const canManage = authSession.hasPermission("academics.taxonomy.manage")
  const [currentRecord, setCurrentRecord] = useState<TaxonomyRecord | null>(record)
  const [formState, setFormState] = useState<TaxonomyFormState>(() => buildFormState(record))
  const [message, setMessage] = useState<string | null>(null)

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (_unused: undefined, accessToken) => {
      const sharedInput = {
        code: formState.code.trim() || undefined,
        description: formState.description.trim() || undefined,
        isActive: formState.isActive,
        name: formState.name.trim(),
        orderIndex: parseOptionalInteger(formState.orderIndex),
        slug: formState.slug.trim() || undefined,
        visibility: formState.visibility,
      }

      if (!sharedInput.name) {
        throw new Error("Name is required.")
      }

      if (entity === "examTracks") {
        const input = {
          ...sharedInput,
          shortName: formState.shortName.trim() || undefined,
        }

        return currentRecord && "shortName" in currentRecord
          ? updateAdminExamTrack(currentRecord.id, input, accessToken)
          : createAdminExamTrack(input, accessToken)
      }

      if (entity === "mediums") {
        return currentRecord && !("examTrackId" in currentRecord)
          ? updateAdminMedium(currentRecord.id, sharedInput, accessToken)
          : createAdminMedium(sharedInput, accessToken)
      }

      if (entity === "subjects") {
        const input = {
          ...sharedInput,
          examTrackId: formState.examTrackId,
        }

        if (!input.examTrackId) {
          throw new Error("An exam track is required for subjects.")
        }

        return currentRecord && "examTrackId" in currentRecord
          ? updateAdminSubject(currentRecord.id, input, accessToken)
          : createAdminSubject(input, accessToken)
      }

      if (entity === "topics") {
        const input = {
          ...sharedInput,
          parentId: formState.parentId.trim() || undefined,
          subjectId: formState.subjectId,
        }

        if (!input.subjectId) {
          throw new Error("A subject is required for topics.")
        }

        return currentRecord && "subjectId" in currentRecord
          ? updateAdminTopic(currentRecord.id, input, accessToken)
          : createAdminTopic(input, accessToken)
      }

      return currentRecord && !("subjectId" in currentRecord) && !("examTrackId" in currentRecord)
        ? updateAdminTag(currentRecord.id, sharedInput, accessToken)
        : createAdminTag(sharedInput, accessToken)
    },
    onSuccess: async (savedRecord) => {
      await invalidateTaxonomyQueries(queryClient)

      if (!currentRecord) {
        router.replace(getAdminTaxonomyEditHref(entity, savedRecord.id))
        return
      }

      setCurrentRecord(savedRecord)
      setFormState(buildFormState(savedRecord))
      setMessage(`${getSingleEntityLabel(entity)} saved successfully.`)
    },
  })

  const selectableTopics = useMemo(
    () => topics.filter((topic) => topic.id !== currentRecord?.id),
    [currentRecord?.id, topics],
  )

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Catalog editor"
        title={
          currentRecord ? `Update ${currentRecord.name}` : `New ${getSingleEntityLabel(entity)}`
        }
        description="Shared catalog fields stay consistent across the taxonomy tree so later modules can resolve references without frontend-side shape drift."
        actions={
          <>
            <Link href={getAdminTaxonomyEntityHref(entity)} className="tc-button-secondary">
              Back to list
            </Link>
            <button
              type="button"
              className="tc-button-primary"
              disabled={!canManage || saveMutation.isPending || !formState.name.trim()}
              onClick={() => saveMutation.mutate(undefined)}
            >
              {saveMutation.isPending
                ? "Saving..."
                : currentRecord
                  ? "Save changes"
                  : "Create record"}
            </button>
          </>
        }
      />

      <AdminRouteTabs
        activeHref={getAdminTaxonomyEntityHref(entity)}
        items={getTaxonomyRouteTabs()}
      />

      {currentRecord ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Status</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentRecord.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Visibility</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentRecord.visibility}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Updated</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {formatAdminDateTime(currentRecord.updatedAt)}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Order</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentRecord.orderIndex}
            </p>
          </div>
        </div>
      ) : null}

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {saveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(saveMutation.error, "The taxonomy record could not be saved.")}
        </AdminInlineNotice>
      ) : null}

      <section className="tc-card rounded-[28px] p-6">
        <div className="grid gap-4">
          <AdminFontTextField
            disabled={!canManage}
            label="Name"
            storage="plain"
            value={formState.name}
            onChange={(value) =>
              setFormState((current) => ({ ...current, name: value }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <AdminInput
              disabled={!canManage}
              label="Code"
              value={formState.code}
              onChange={(event) =>
                setFormState((current) => ({ ...current, code: event.target.value }))
              }
            />
            <AdminInput
              disabled={!canManage}
              label="Slug"
              value={formState.slug}
              onChange={(event) =>
                setFormState((current) => ({ ...current, slug: event.target.value }))
              }
            />
          </div>

          {entity === "examTracks" ? (
            <AdminFontTextField
              disabled={!canManage}
              label="Short name"
              storage="plain"
              value={formState.shortName}
              onChange={(value) =>
                setFormState((current) => ({ ...current, shortName: value }))
              }
            />
          ) : null}

          <AdminFontTextField
            disabled={!canManage}
            label="Description"
            multiline
            rows={4}
            storage="plain"
            value={formState.description}
            onChange={(value) =>
              setFormState((current) => ({ ...current, description: value }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <AdminSelect
              disabled={!canManage}
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
              disabled={!canManage}
              label="Order index"
              type="number"
              value={formState.orderIndex}
              onChange={(event) =>
                setFormState((current) => ({ ...current, orderIndex: event.target.value }))
              }
            />
          </div>

          {entity === "subjects" ? (
            <AdminSelect
              disabled={!canManage}
              label="Exam track"
              value={formState.examTrackId}
              onChange={(event) =>
                setFormState((current) => ({ ...current, examTrackId: event.target.value }))
              }
            >
              <option value="">Select exam track</option>
              {sortByOrderIndex(examTracks).map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </AdminSelect>
          ) : null}

          {entity === "topics" ? (
            <>
              <AdminSelect
                disabled={!canManage}
                label="Subject"
                value={formState.subjectId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, subjectId: event.target.value }))
                }
              >
                <option value="">Select subject</option>
                {sortByOrderIndex(subjects).map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                disabled={!canManage}
                label="Parent topic"
                value={formState.parentId}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, parentId: event.target.value }))
                }
              >
                <option value="">Root topic</option>
                {sortByOrderIndex(selectableTopics).map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </AdminSelect>
            </>
          ) : null}

          <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
            <input
              checked={formState.isActive}
              disabled={!canManage}
              type="checkbox"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Keep this record active for downstream catalog use.
          </label>
        </div>
      </section>
    </div>
  )
}
