"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { adminQueryKeys } from "@/lib/api/query-keys"
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth"
import {
  createAdminCmsAnnouncement,
  createAdminCmsBanner,
  createAdminCmsPage,
  createAdminCmsSection,
  formatAdminDateTime,
  getApiErrorMessage,
  getCmsCollectionLabel,
  getCmsRecordAsset,
  getCmsSectionTypeLabel,
  getCmsSurfaceLabel,
  isCmsRecordPublished,
  listAdminCmsAnnouncements,
  listAdminCmsBanners,
  listAdminCmsPages,
  listAdminCmsSections,
  publishAdminCmsAnnouncement,
  publishAdminCmsBanner,
  publishAdminCmsPage,
  publishAdminCmsSection,
  reorderAdminCmsAnnouncements,
  reorderAdminCmsBanners,
  reorderAdminCmsPages,
  reorderAdminCmsSections,
  summarizeCmsRecord,
  unpublishAdminCmsAnnouncement,
  unpublishAdminCmsBanner,
  unpublishAdminCmsPage,
  unpublishAdminCmsSection,
  updateAdminCmsAnnouncement,
  updateAdminCmsBanner,
  updateAdminCmsPage,
  updateAdminCmsSection,
  type CmsAnnouncementLevel,
  type CmsBannerPlacement,
  type CmsCollection,
  type CmsListQuery,
  type CmsRecord,
  type CmsSectionSurface,
  type CmsSectionType,
  type CmsStatus,
  type CmsVisibility,
} from "@/lib/admin"
import {
  buildStructuredDocumentFromHtml,
  htmlToPlainText,
  readStructuredDocumentHtml,
} from "@/lib/admin/rich-text"
import {
  AdminAnnouncementLevelBadge,
  AdminStatusBadge,
  AdminVisibilityBadge,
} from "@/components/admin/admin-status-badge"
import { AdminAssetUploader } from "@/components/admin/admin-asset-uploader"
import {
  AdminCmsCtaEditor,
  AdminCmsFeedItemsEditor,
  AdminCmsStatsEditor,
  buildCmsCtaRows,
  buildCmsFeedItemRows,
  buildCmsStatRows,
  serializeCmsCtaRows,
  serializeCmsFeedItemRows,
  serializeCmsStatRows,
  type AdminCmsCtaRow,
  type AdminCmsFeedItemRow,
  type AdminCmsStatRow,
} from "@/components/admin/admin-cms-friendly-editors"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminFontTextField } from "@/components/admin/admin-font-text-field"
import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field"
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice"
import {
  AdminKeyValueEditor,
  parseKeyValueObject,
  serializeKeyValueRows,
  type AdminKeyValueRow,
} from "@/components/admin/admin-key-value-editor"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminRichHtmlField } from "@/components/admin/admin-rich-html-field"
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs"
import { TextContent } from "@/components/primitives/text-content"
import { EmptyState } from "@/components/primitives/empty-state"
import { ErrorState } from "@/components/primitives/error-state"
import { LoadingState } from "@/components/primitives/loading-state"

const CMS_STATUS_OPTIONS: CmsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"]
const CMS_VISIBILITY_OPTIONS: CmsVisibility[] = ["PUBLIC", "AUTHENTICATED", "INTERNAL"]
const CMS_PLACEMENT_OPTIONS: CmsBannerPlacement[] = [
  "LANDING_HOME",
  "STUDENT_HOME",
  "COMMON",
]
const CMS_SURFACE_OPTIONS: CmsSectionSurface[] = ["LANDING_HOME", "STUDENT_HOME"]
const CMS_SECTION_TYPE_OPTIONS: CmsSectionType[] = [
  "RICH_TEXT",
  "CONTENT_FEED",
  "PLAN_HIGHLIGHTS",
  "CTA_GROUP",
]
const ANNOUNCEMENT_LEVEL_OPTIONS: CmsAnnouncementLevel[] = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "CRITICAL",
]

type CmsManagementView = "list" | "editor"

interface CmsLinkedAsset {
  accessLevel?: string
  contentType?: string
  id: string
  originalFileName: string
  publicDeliveryPath?: string
  status?: string
}

interface CmsEditorFormState {
  announcementBodyHtml: string
  announcementMetaRows: AdminKeyValueRow[]
  bannerBodyHtml: string
  bannerMetaRows: AdminKeyValueRow[]
  bannerSecondaryCtaHref: string
  bannerSecondaryCtaLabel: string
  bannerStatsRows: AdminCmsStatRow[]
  code: string
  columns: string
  ctaHref: string
  ctaLabel: string
  endsAt: string
  eyeBrow: string
  imageAssetId: string
  isPinned: boolean
  level: CmsAnnouncementLevel
  linkHref: string
  linkLabel: string
  note: string
  orderIndex: string
  pageBodyHtml: string
  placement: CmsBannerPlacement
  sectionConfigRows: AdminKeyValueRow[]
  sectionCtaRows: AdminCmsCtaRow[]
  sectionFeedRows: AdminCmsFeedItemRow[]
  sectionRichTextHtml: string
  sectionStatsRows: AdminCmsStatRow[]
  seoDescription: string
  seoExtraRows: AdminKeyValueRow[]
  seoKeywords: string
  seoNoIndex: boolean
  seoTitle: string
  slug: string
  startsAt: string
  subtitle: string
  summary: string
  surface: CmsSectionSurface
  title: string
  type: CmsSectionType
  visibility: CmsVisibility
}

const EMPTY_FORM_STATE: CmsEditorFormState = {
  announcementBodyHtml: "",
  announcementMetaRows: [],
  bannerBodyHtml: "",
  bannerMetaRows: [],
  bannerSecondaryCtaHref: "",
  bannerSecondaryCtaLabel: "",
  bannerStatsRows: [],
  code: "",
  columns: "",
  ctaHref: "",
  ctaLabel: "",
  endsAt: "",
  eyeBrow: "",
  imageAssetId: "",
  isPinned: false,
  level: "INFO",
  linkHref: "",
  linkLabel: "",
  note: "",
  orderIndex: "",
  pageBodyHtml: "",
  placement: "LANDING_HOME",
  sectionConfigRows: [],
  sectionCtaRows: [],
  sectionFeedRows: [],
  sectionRichTextHtml: "",
  sectionStatsRows: [],
  seoDescription: "",
  seoExtraRows: [],
  seoKeywords: "",
  seoNoIndex: false,
  seoTitle: "",
  slug: "",
  startsAt: "",
  subtitle: "",
  summary: "",
  surface: "LANDING_HOME",
  title: "",
  type: "RICH_TEXT",
  visibility: "PUBLIC",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function readString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []
}

function buildParagraphHtmlFromArray(value: unknown) {
  const paragraphs = readStringArray(value)
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
}

function trimOrUndefined(value: string) {
  const normalized = value.trim()
  return normalized || undefined
}

function toDatetimeLocalValue(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return ""
  }

  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined
  }

  return new Date(value).toISOString()
}

function toOrderIndex(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function asSchemaJson(value: Record<string, unknown> | undefined) {
  return value as Record<string, never> | undefined
}

function asRequiredSchemaJson(value: Record<string, unknown> | undefined) {
  return (value ?? {}) as Record<string, never>
}

function omitObjectKeys(
  value: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  const source = value ?? {}
  const nextValue: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(source)) {
    if (keys.includes(key)) {
      continue
    }

    nextValue[key] = entry
  }

  return nextValue
}

function mergeSchemaObjects(...values: Array<Record<string, unknown> | undefined>) {
  const nextValue: Record<string, unknown> = {}

  for (const entry of values) {
    if (!entry) {
      continue
    }

    Object.assign(nextValue, entry)
  }

  return Object.keys(nextValue).length > 0 ? nextValue : undefined
}

function readCmsRichTextHtml(value: unknown) {
  if (isRecord(value) && Array.isArray(value.paragraphs)) {
    return buildParagraphHtmlFromArray(value.paragraphs)
  }

  return readStructuredDocumentHtml(value)
}

function getCmsCollectionHref(collection: CmsCollection) {
  return `/admin/cms/${collection}`
}

function getCmsEditorHref(collection: CmsCollection, recordId: string) {
  return `${getCmsCollectionHref(collection)}/${recordId}`
}

function getCmsNewHref(collection: CmsCollection) {
  return `${getCmsCollectionHref(collection)}/new`
}

function buildCmsCollectionQuery(
  collection: CmsCollection,
  filters: {
    placement: string
    search: string
    status: string
    surface: string
    visibility: string
  },
): NonNullable<CmsListQuery> {
  return {
    placement: collection === "banners" ? (filters.placement as CmsBannerPlacement) : undefined,
    q: filters.search.trim() || undefined,
    status: filters.status ? (filters.status as CmsStatus) : undefined,
    surface: collection === "sections" ? (filters.surface as CmsSectionSurface) : undefined,
    visibility: filters.visibility ? (filters.visibility as CmsVisibility) : undefined,
  }
}

async function listCmsRecords(
  collection: CmsCollection,
  accessToken: string,
  query: CmsListQuery = {},
) {
  switch (collection) {
    case "pages":
      return listAdminCmsPages(accessToken, query)
    case "banners":
      return listAdminCmsBanners(accessToken, query)
    case "announcements":
      return listAdminCmsAnnouncements(accessToken, query)
    case "sections":
      return listAdminCmsSections(accessToken, query)
  }
}

function sortRecords(records: CmsRecord[], orderedIds: string[]) {
  if (orderedIds.length === 0) {
    return [...records].sort((left, right) => left.orderIndex - right.orderIndex)
  }

  const orderLookup = new Map(orderedIds.map((id, index) => [id, index]))

  return [...records].sort((left, right) => {
    const leftIndex = orderLookup.get(left.id)
    const rightIndex = orderLookup.get(right.id)

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

function hasMatchingOrder(ids: string[], records: CmsRecord[]) {
  if (ids.length !== records.length) {
    return false
  }

  const recordIds = new Set(records.map((record) => record.id))
  return ids.every((id) => recordIds.has(id))
}

function getCmsRouteTabs() {
  return [
    {
      href: getCmsCollectionHref("pages"),
      label: "Pages",
      description: "Standalone public pages and policy screens.",
    },
    {
      href: getCmsCollectionHref("banners"),
      label: "Banners",
      description: "Home hero and shared promotional banners.",
    },
    {
      href: getCmsCollectionHref("announcements"),
      label: "Announcements",
      description: "Public and student-facing notices.",
    },
    {
      href: getCmsCollectionHref("sections"),
      label: "Sections",
      description: "Landing and student home modules.",
    },
  ]
}

function buildFormState(record: CmsRecord | null): CmsEditorFormState {
  if (!record) {
    return EMPTY_FORM_STATE
  }

  if ("slug" in record) {
    const seoJson = isRecord(record.seoJson) ? record.seoJson : {}
    const rawKeywords: unknown[] = Array.isArray(seoJson["keywords"])
      ? seoJson["keywords"]
      : []
    const keywords = rawKeywords
          .filter((entry): entry is string => typeof entry === "string")
          .join(", ")

    return {
      ...EMPTY_FORM_STATE,
      imageAssetId: readString(record.coverImageAssetId),
      orderIndex: String(record.orderIndex),
      pageBodyHtml: readStructuredDocumentHtml(record.bodyJson),
      seoDescription: readString(seoJson.description),
      seoExtraRows: parseKeyValueObject(
        omitObjectKeys(seoJson, ["title", "description", "keywords", "noIndex"]),
      ),
      seoKeywords: keywords,
      seoNoIndex: seoJson.noIndex === true,
      seoTitle: readString(seoJson.title),
      slug: record.slug,
      summary: readString(record.summary),
      title: record.title,
      visibility: record.visibility,
    }
  }

  if ("placement" in record) {
    const metaJson = isRecord(record.metaJson) ? record.metaJson : {}

    return {
      ...EMPTY_FORM_STATE,
      bannerBodyHtml: readString(record.body),
      bannerMetaRows: parseKeyValueObject(
        omitObjectKeys(metaJson, ["secondaryCtaHref", "secondaryCtaLabel", "stats"]),
      ),
      bannerSecondaryCtaHref: readString(metaJson.secondaryCtaHref),
      bannerSecondaryCtaLabel: readString(metaJson.secondaryCtaLabel),
      bannerStatsRows: buildCmsStatRows(metaJson.stats),
      ctaHref: readString(record.ctaHref),
      ctaLabel: readString(record.ctaLabel),
      endsAt: toDatetimeLocalValue(record.endsAt),
      imageAssetId: readString(record.imageAssetId),
      orderIndex: String(record.orderIndex),
      placement: record.placement,
      startsAt: toDatetimeLocalValue(record.startsAt),
      subtitle: readString(record.subtitle),
      title: record.title,
      visibility: record.visibility,
    }
  }

  if ("level" in record) {
    return {
      ...EMPTY_FORM_STATE,
      announcementBodyHtml: record.body,
      announcementMetaRows: parseKeyValueObject(record.metaJson),
      endsAt: toDatetimeLocalValue(record.endsAt),
      isPinned: record.isPinned,
      level: record.level,
      linkHref: readString(record.linkHref),
      linkLabel: readString(record.linkLabel),
      orderIndex: String(record.orderIndex),
      startsAt: toDatetimeLocalValue(record.startsAt),
      title: record.title,
      visibility: record.visibility,
    }
  }

  const configJson = isRecord(record.configJson) ? record.configJson : {}

  return {
    ...EMPTY_FORM_STATE,
    code: record.code,
    columns:
      typeof configJson.columns === "number" ? String(configJson.columns) : "",
    eyeBrow: readString(configJson.eyebrow),
    imageAssetId: readString(record.imageAssetId),
    note: readString(configJson.note),
    orderIndex: String(record.orderIndex),
    sectionConfigRows: parseKeyValueObject(
      omitObjectKeys(configJson, ["columns", "eyebrow", "note"]),
    ),
    sectionCtaRows:
      record.type === "CTA_GROUP" ? buildCmsCtaRows(record.bodyJson?.items) : [],
    sectionFeedRows:
      record.type === "CONTENT_FEED"
        ? buildCmsFeedItemRows(record.bodyJson?.items)
        : [],
    sectionRichTextHtml:
      record.type === "RICH_TEXT" ? readCmsRichTextHtml(record.bodyJson) : "",
    sectionStatsRows:
      record.type === "RICH_TEXT" ? buildCmsStatRows(record.bodyJson?.stats) : [],
    subtitle: readString(record.subtitle),
    surface: record.surface,
    title: record.title,
    type: record.type,
    visibility: record.visibility,
  }
}

function buildPageSeoJson(form: CmsEditorFormState) {
  const keywords = form.seoKeywords
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  return mergeSchemaObjects(
    serializeKeyValueRows(form.seoExtraRows),
    trimOrUndefined(form.seoTitle) ? { title: trimOrUndefined(form.seoTitle) } : undefined,
    trimOrUndefined(form.seoDescription)
      ? { description: trimOrUndefined(form.seoDescription) }
      : undefined,
    keywords.length > 0 ? { keywords } : undefined,
    form.seoNoIndex ? { noIndex: true } : undefined,
  )
}

function buildBannerMetaJson(form: CmsEditorFormState) {
  return mergeSchemaObjects(
    serializeKeyValueRows(form.bannerMetaRows),
    trimOrUndefined(form.bannerSecondaryCtaLabel)
      ? { secondaryCtaLabel: trimOrUndefined(form.bannerSecondaryCtaLabel) }
      : undefined,
    trimOrUndefined(form.bannerSecondaryCtaHref)
      ? { secondaryCtaHref: trimOrUndefined(form.bannerSecondaryCtaHref) }
      : undefined,
    serializeCmsStatRows(form.bannerStatsRows)
      ? { stats: serializeCmsStatRows(form.bannerStatsRows) }
      : undefined,
  )
}

function buildSectionConfigJson(form: CmsEditorFormState) {
  return mergeSchemaObjects(
    serializeKeyValueRows(form.sectionConfigRows),
    trimOrUndefined(form.eyeBrow) ? { eyebrow: trimOrUndefined(form.eyeBrow) } : undefined,
    form.type === "CONTENT_FEED" && toOptionalNumber(form.columns)
      ? { columns: toOptionalNumber(form.columns) }
      : undefined,
    form.type === "PLAN_HIGHLIGHTS" && trimOrUndefined(form.note)
      ? { note: trimOrUndefined(form.note) }
      : undefined,
  )
}

function buildSectionBodyJson(form: CmsEditorFormState) {
  if (form.type === "RICH_TEXT") {
    return mergeSchemaObjects(
      buildStructuredDocumentFromHtml(form.sectionRichTextHtml),
      serializeCmsStatRows(form.sectionStatsRows)
        ? { stats: serializeCmsStatRows(form.sectionStatsRows) }
        : undefined,
    )
  }

  if (form.type === "CONTENT_FEED") {
    const items = serializeCmsFeedItemRows(form.sectionFeedRows)
    return items ? { items } : undefined
  }

  if (form.type === "CTA_GROUP") {
    const items = serializeCmsCtaRows(form.sectionCtaRows)
    return items ? { items } : undefined
  }

  return undefined
}

function hasMeaningfulHtml(value: string) {
  return htmlToPlainText(value).trim().length > 0
}

function buildEditorTitle(collection: CmsCollection, record: CmsRecord | null) {
  if (record) {
    return htmlToPlainText(record.title) || record.title
  }

  const label = getCmsCollectionLabel(collection)
  return `New ${label.slice(0, -1).toLowerCase()}`
}

export function AdminCmsManagementScreen({
  collection,
  recordId,
  view = "list",
}: Readonly<{
  collection: CmsCollection
  recordId?: string
  view?: CmsManagementView
}>) {
  if (view === "editor") {
    return <AdminCmsEditorScreen collection={collection} recordId={recordId} />
  }

  return <AdminCmsListScreen collection={collection} />
}

function AdminCmsListScreen({
  collection,
}: Readonly<{
  collection: CmsCollection
}>) {
  const router = useRouter()
  const authSession = useAuthSession()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [visibility, setVisibility] = useState("")
  const [placement, setPlacement] = useState("")
  const [surface, setSurface] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [orderIds, setOrderIds] = useState<string[]>([])

  const hasManagePermission = authSession.hasPermission("content.cms.manage")

  const filters = useMemo(
    () =>
      buildCmsCollectionQuery(collection, {
        placement,
        search,
        status,
        surface,
        visibility,
      }),
    [collection, placement, search, status, surface, visibility],
  )

  const listQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => listCmsRecords(collection, accessToken, filters),
    queryKey: adminQueryKeys.cms(collection, filters),
    staleTime: 15_000,
  })

  const records = useMemo(() => (listQuery.data?.items ?? []) as CmsRecord[], [listQuery.data])
  const defaultOrderIds = useMemo(
    () =>
      records
        .slice()
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((record) => record.id),
    [records],
  )
  const effectiveOrderIds = useMemo(
    () => (hasMatchingOrder(orderIds, records) ? orderIds : defaultOrderIds),
    [defaultOrderIds, orderIds, records],
  )
  const sortedRecords = useMemo(
    () => sortRecords(records, effectiveOrderIds),
    [effectiveOrderIds, records],
  )

  const reorderMutation = useAuthenticatedMutation({
    mutationFn: async (_unused: undefined, accessToken) => {
      const payload = {
        orderedIds: effectiveOrderIds,
      }

      switch (collection) {
        case "pages":
          return reorderAdminCmsPages(payload, accessToken)
        case "banners":
          return reorderAdminCmsBanners(payload, accessToken)
        case "announcements":
          return reorderAdminCmsAnnouncements(payload, accessToken)
        case "sections":
          return reorderAdminCmsSections(payload, accessToken)
      }
    },
    onSuccess: async () => {
      setMessage(`${getCmsCollectionLabel(collection)} order saved.`)
      await queryClient.invalidateQueries({
        queryKey: ["admin", "cms", collection],
      })
    },
  })

  if (listQuery.isLoading) {
    return (
      <LoadingState
        title={`Loading ${getCmsCollectionLabel(collection).toLowerCase()}`}
        description="Fetching the latest records for this CMS collection."
      />
    )
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        title={`The ${getCmsCollectionLabel(collection).toLowerCase()} workspace could not be loaded.`}
        description="We couldn't load this CMS collection right now."
        onRetry={() => void listQuery.refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="CMS management"
        title={getCmsCollectionLabel(collection)}
        description="Use the list here for filtering and ordering, then open a dedicated editor page to create or update one record at a time."
        actions={
          <>
            <Link href={getCmsNewHref(collection)} className="tc-button-primary">
              New record
            </Link>
            <button
              type="button"
              className="tc-button-secondary"
              disabled={!hasManagePermission || effectiveOrderIds.length === 0 || reorderMutation.isPending}
              onClick={() => reorderMutation.mutate(undefined)}
            >
              {reorderMutation.isPending ? "Saving order..." : "Save order"}
            </button>
          </>
        }
      />

      <AdminRouteTabs
        activeHref={getCmsCollectionHref(collection)}
        items={getCmsRouteTabs()}
      />

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {reorderMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(reorderMutation.error, "The visible order could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {!hasManagePermission ? (
        <AdminInlineNotice>
          This login can review the CMS collections but cannot change records.
        </AdminInlineNotice>
      ) : null}

      <AdminFilterBar
        searchPlaceholder={`Search ${getCmsCollectionLabel(collection).toLowerCase()} by title or code`}
        searchValue={search}
        onSearchValueChange={setSearch}
        resultSummary={`${records.length} ${getCmsCollectionLabel(collection).toLowerCase()} found`}
        actions={
          <button
            type="button"
            className="tc-button-secondary"
            onClick={() => {
              setSearch("")
              setStatus("")
              setVisibility("")
              setPlacement("")
              setSurface("")
            }}
          >
            Reset filters
          </button>
        }
      >
        <AdminSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {CMS_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
        >
          <option value="">All visibility</option>
          {CMS_VISIBILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
        {collection === "banners" ? (
          <AdminSelect
            label="Placement"
            value={placement}
            onChange={(event) => setPlacement(event.target.value)}
          >
            <option value="">All placements</option>
            {CMS_PLACEMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </AdminSelect>
        ) : null}
        {collection === "sections" ? (
          <AdminSelect
            label="Surface"
            value={surface}
            onChange={(event) => setSurface(event.target.value)}
          >
            <option value="">All surfaces</option>
            {CMS_SURFACE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {getCmsSurfaceLabel(option)}
              </option>
            ))}
          </AdminSelect>
        ) : null}
      </AdminFilterBar>

      <AdminDataTable
        columns={[
          {
            header: "Record",
            render: (record: CmsRecord) => (
              <div className="space-y-2">
                <TextContent
                  as="p"
                  className="font-semibold text-[color:var(--brand)]"
                  value={record.title}
                />
                <p className="text-xs text-[color:var(--muted)]">
                  {htmlToPlainText(summarizeCmsRecord(record)) || summarizeCmsRecord(record)}
                </p>
              </div>
            ),
          },
          {
            header: "Status",
            render: (record: CmsRecord) => (
              <div className="flex flex-wrap gap-2">
                <AdminStatusBadge status={record.status} />
                <AdminVisibilityBadge visibility={record.visibility} />
                {"level" in record ? (
                  <AdminAnnouncementLevelBadge level={record.level} />
                ) : null}
              </div>
            ),
          },
          {
            header: "Order",
            render: (record: CmsRecord) => (
              <div className="space-y-2 text-sm text-[color:var(--muted)]">
                <p>#{record.orderIndex}</p>
                <p>
                  {formatAdminDateTime(
                    "publishedAt" in record && typeof record.publishedAt === "string"
                      ? record.publishedAt
                      : null,
                  )}
                </p>
              </div>
            ),
          },
          {
            header: "Actions",
            render: (record: CmsRecord) => (
              <div className="flex flex-wrap gap-2">
                <Link href={getCmsEditorHref(collection, record.id)} className="tc-button-secondary">
                  Edit
                </Link>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!hasManagePermission}
                  onClick={() =>
                    setOrderIds((current) =>
                      moveRecord(
                        hasMatchingOrder(current, records) ? current : defaultOrderIds,
                        record.id,
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
                  disabled={!hasManagePermission}
                  onClick={() =>
                    setOrderIds((current) =>
                      moveRecord(
                        hasMatchingOrder(current, records) ? current : defaultOrderIds,
                        record.id,
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
        emptyState={
          <EmptyState
            eyebrow="No records"
            title={`No ${getCmsCollectionLabel(collection).toLowerCase()} matched the current filters.`}
            description="Reset the filters or create the first record for this CMS collection."
          />
        }
        getRowId={(record: CmsRecord) => record.id}
        onRowClick={(record: CmsRecord) => router.push(getCmsEditorHref(collection, record.id))}
        rows={sortedRecords}
      />
    </div>
  )
}

function AdminCmsEditorScreen({
  collection,
  recordId,
}: Readonly<{
  collection: CmsCollection
  recordId?: string
}>) {
  const authSession = useAuthSession()
  const canReadCms = authSession.hasPermission("content.cms.read")

  const listQuery = useAuthenticatedQuery({
    enabled: Boolean(recordId) && canReadCms,
    queryFn: (accessToken) => listCmsRecords(collection, accessToken),
    queryKey: adminQueryKeys.cms(collection, {}),
    staleTime: 15_000,
  })

  const currentRecord = useMemo(() => {
    if (!recordId) {
      return null
    }

    return ((listQuery.data?.items ?? []) as CmsRecord[]).find((record) => record.id === recordId) ?? null
  }, [listQuery.data?.items, recordId])

  if (recordId && listQuery.isLoading) {
    return (
      <LoadingState
        title={`Loading ${getCmsCollectionLabel(collection).slice(0, -1).toLowerCase()} editor`}
        description="Fetching this CMS record and its current publication state."
      />
    )
  }

  if (recordId && listQuery.isError) {
    return (
      <ErrorState
        title="The CMS editor could not load."
        description="We couldn't finish loading this record."
        onRetry={() => void listQuery.refetch()}
      />
    )
  }

  if (recordId && !currentRecord) {
    return (
      <EmptyState
        eyebrow="CMS"
        title="This record could not be found."
        description="Return to the collection list and choose another record."
      />
    )
  }

  return (
    <AdminCmsEditorForm
      key={
        currentRecord
          ? `${collection}:${currentRecord.id}:${typeof currentRecord.publishedAt === "string" ? currentRecord.publishedAt : "loaded"}`
          : `${collection}:new`
      }
      collection={collection}
      record={currentRecord}
    />
  )
}

function AdminCmsEditorForm({
  collection,
  record,
}: Readonly<{
  collection: CmsCollection
  record: CmsRecord | null
}>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const authSession = useAuthSession()
  const hasManagePermission = authSession.hasPermission("content.cms.manage")
  const hasPublishPermission = authSession.hasPermission("content.cms.publish")
  const [currentRecord, setCurrentRecord] = useState<CmsRecord | null>(record)
  const [form, setForm] = useState<CmsEditorFormState>(() => buildFormState(record))
  const [currentAsset, setCurrentAsset] = useState<CmsLinkedAsset | null>(
    (getCmsRecordAsset(record) ?? null) as CmsLinkedAsset | null,
  )
  const [message, setMessage] = useState<string | null>(null)

  async function invalidateCollection() {
    await queryClient.invalidateQueries({
      queryKey: ["admin", "cms", collection],
    })
  }

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (_unused: undefined, accessToken) => {
      switch (collection) {
        case "pages": {
          const payload = {
            bodyJson: asRequiredSchemaJson(
              buildStructuredDocumentFromHtml(form.pageBodyHtml),
            ),
            coverImageAssetId: trimOrUndefined(form.imageAssetId),
            orderIndex: toOrderIndex(form.orderIndex),
            seoJson: asSchemaJson(buildPageSeoJson(form)),
            slug: form.slug.trim(),
            summary: trimOrUndefined(form.summary),
            title: form.title.trim(),
            visibility: form.visibility,
          }

          return currentRecord
            ? updateAdminCmsPage(currentRecord.id, payload, accessToken)
            : createAdminCmsPage(payload, accessToken)
        }

        case "banners": {
          const payload = {
            body: trimOrUndefined(form.bannerBodyHtml),
            ctaHref: trimOrUndefined(form.ctaHref),
            ctaLabel: trimOrUndefined(form.ctaLabel),
            endsAt: toIsoDateTime(form.endsAt),
            imageAssetId: trimOrUndefined(form.imageAssetId),
            metaJson: asSchemaJson(buildBannerMetaJson(form)),
            orderIndex: toOrderIndex(form.orderIndex),
            placement: form.placement,
            startsAt: toIsoDateTime(form.startsAt),
            subtitle: trimOrUndefined(form.subtitle),
            title: form.title.trim(),
            visibility: form.visibility,
          }

          return currentRecord
            ? updateAdminCmsBanner(currentRecord.id, payload, accessToken)
            : createAdminCmsBanner(payload, accessToken)
        }

        case "announcements": {
          const payload = {
            body: form.announcementBodyHtml.trim(),
            endsAt: toIsoDateTime(form.endsAt),
            isPinned: form.isPinned,
            level: form.level,
            linkHref: trimOrUndefined(form.linkHref),
            linkLabel: trimOrUndefined(form.linkLabel),
            metaJson: asSchemaJson(serializeKeyValueRows(form.announcementMetaRows)),
            orderIndex: toOrderIndex(form.orderIndex),
            startsAt: toIsoDateTime(form.startsAt),
            title: form.title.trim(),
            visibility: form.visibility,
          }

          return currentRecord
            ? updateAdminCmsAnnouncement(currentRecord.id, payload, accessToken)
            : createAdminCmsAnnouncement(payload, accessToken)
        }

        case "sections": {
          const payload = {
            bodyJson: asSchemaJson(buildSectionBodyJson(form)),
            code: form.code.trim(),
            configJson: asSchemaJson(buildSectionConfigJson(form)),
            imageAssetId: trimOrUndefined(form.imageAssetId),
            orderIndex: toOrderIndex(form.orderIndex),
            subtitle: trimOrUndefined(form.subtitle),
            surface: form.surface,
            title: form.title.trim(),
            type: form.type,
            visibility: form.visibility,
          }

          return currentRecord
            ? updateAdminCmsSection(currentRecord.id, payload, accessToken)
            : createAdminCmsSection(payload, accessToken)
        }
      }
    },
    onSuccess: async (savedRecord) => {
      await invalidateCollection()

      if (!currentRecord) {
        router.replace(getCmsEditorHref(collection, savedRecord.id))
        return
      }

      setCurrentRecord(savedRecord)
      setCurrentAsset(getCmsRecordAsset(savedRecord) ?? null)
      setForm(buildFormState(savedRecord))
      setMessage(`${getCmsCollectionLabel(collection).slice(0, -1)} saved.`)
    },
  })

  const publishMutation = useAuthenticatedMutation({
    mutationFn: async (_unused: undefined, accessToken) => {
      if (!currentRecord) {
        throw new Error("Save this record before changing its publish status.")
      }

      switch (collection) {
        case "pages":
          return isCmsRecordPublished(currentRecord)
            ? unpublishAdminCmsPage(currentRecord.id, accessToken)
            : publishAdminCmsPage(currentRecord.id, accessToken)
        case "banners":
          return isCmsRecordPublished(currentRecord)
            ? unpublishAdminCmsBanner(currentRecord.id, accessToken)
            : publishAdminCmsBanner(currentRecord.id, accessToken)
        case "announcements":
          return isCmsRecordPublished(currentRecord)
            ? unpublishAdminCmsAnnouncement(currentRecord.id, accessToken)
            : publishAdminCmsAnnouncement(currentRecord.id, accessToken)
        case "sections":
          return isCmsRecordPublished(currentRecord)
            ? unpublishAdminCmsSection(currentRecord.id, accessToken)
            : publishAdminCmsSection(currentRecord.id, accessToken)
      }
    },
    onSuccess: async (savedRecord) => {
      setCurrentRecord(savedRecord)
      setCurrentAsset(getCmsRecordAsset(savedRecord) ?? null)
      setForm(buildFormState(savedRecord))
      setMessage(
        isCmsRecordPublished(savedRecord)
          ? `${htmlToPlainText(savedRecord.title) || "Record"} is published.`
          : `${htmlToPlainText(savedRecord.title) || "Record"} moved back to draft.`,
      )
      await invalidateCollection()
    },
  })

  const canSave =
    collection === "pages"
      ? Boolean(form.title.trim() && form.slug.trim())
      : collection === "banners"
        ? Boolean(form.title.trim())
        : collection === "announcements"
          ? Boolean(form.title.trim() && hasMeaningfulHtml(form.announcementBodyHtml))
          : Boolean(form.title.trim() && form.code.trim())

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="CMS editor"
        title={buildEditorTitle(collection, currentRecord)}
        description="Each CMS record now edits on its own page, with form fields that map back to the same backend DTOs without requiring raw JSON editing."
        actions={
          <>
            <Link href={getCmsCollectionHref(collection)} className="tc-button-secondary">
              Back to list
            </Link>
            {currentRecord ? (
              <button
                type="button"
                className="tc-button-secondary"
                disabled={!hasPublishPermission || publishMutation.isPending}
                onClick={() => publishMutation.mutate(undefined)}
              >
                {publishMutation.isPending
                  ? "Updating..."
                  : isCmsRecordPublished(currentRecord)
                    ? "Move to draft"
                    : "Publish"}
              </button>
            ) : null}
            <button
              type="button"
              className="tc-button-primary"
              disabled={!hasManagePermission || !canSave || saveMutation.isPending}
              onClick={() => {
                setMessage(null)
                saveMutation.mutate(undefined)
              }}
            >
              {saveMutation.isPending
                ? "Saving..."
                : currentRecord
                  ? "Save record"
                  : "Create record"}
            </button>
          </>
        }
      />

      <AdminRouteTabs
        activeHref={getCmsCollectionHref(collection)}
        items={getCmsRouteTabs()}
      />

      {currentRecord ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Status</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentRecord.status}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Visibility</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentRecord.visibility}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Published</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {formatAdminDateTime(
                typeof currentRecord.publishedAt === "string" ? currentRecord.publishedAt : null,
              )}
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
          {getApiErrorMessage(saveMutation.error, "The CMS record could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {publishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            publishMutation.error,
            "The CMS publish state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}
      {!hasManagePermission ? (
        <AdminInlineNotice>
          This login can review the editor but cannot save or publish changes.
        </AdminInlineNotice>
      ) : null}

      <section className="tc-card rounded-[28px] p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminFontTextField
            disabled={!hasManagePermission}
            label="Title"
            storage="html"
            value={form.title}
            onChange={(value) => setForm((current) => ({ ...current, title: value }))}
          />
          <AdminInput
            disabled={!hasManagePermission}
            label="Order index"
            type="number"
            min={0}
            value={form.orderIndex}
            onChange={(event) =>
              setForm((current) => ({ ...current, orderIndex: event.target.value }))
            }
          />
          <AdminSelect
            disabled={!hasManagePermission}
            label="Visibility"
            value={form.visibility}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                visibility: event.target.value as CmsVisibility,
              }))
            }
          >
            {CMS_VISIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </AdminSelect>
        </div>

        {collection === "pages" ? (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminInput
                disabled={!hasManagePermission}
                label="Slug"
                hint="Used for public routes such as /about or /privacy."
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </div>

            <AdminFontTextField
              disabled={!hasManagePermission}
              hint="Shown in the hero area and page listings."
              label="Summary"
              multiline
              preserveParagraphs
              rows={4}
              storage="html"
              value={form.summary}
              onChange={(value) => setForm((current) => ({ ...current, summary: value }))}
            />

            <AdminRichHtmlField
              disabled={!hasManagePermission}
              hint="Use the rich editor instead of writing block JSON by hand."
              label="Page body"
              value={form.pageBodyHtml}
              onChange={(value) =>
                setForm((current) => ({ ...current, pageBodyHtml: value }))
              }
            />

            <section className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/72 p-5">
              <h2 className="tc-display text-xl font-semibold tracking-tight text-[color:var(--brand)]">
                SEO
              </h2>
              <div className="mt-4 grid gap-4">
                <AdminFontTextField
                  disabled={!hasManagePermission}
                  label="SEO title"
                  storage="plain"
                  value={form.seoTitle}
                  onChange={(value) => setForm((current) => ({ ...current, seoTitle: value }))}
                />
                <AdminFontTextField
                  disabled={!hasManagePermission}
                  label="SEO description"
                  multiline
                  rows={3}
                  storage="plain"
                  value={form.seoDescription}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, seoDescription: value }))
                  }
                />
                <AdminInput
                  disabled={!hasManagePermission}
                  label="Keywords"
                  hint="Separate keywords with commas."
                  value={form.seoKeywords}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, seoKeywords: event.target.value }))
                  }
                />
                <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
                  <input
                    checked={form.seoNoIndex}
                    disabled={!hasManagePermission}
                    type="checkbox"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        seoNoIndex: event.target.checked,
                      }))
                    }
                  />
                  Do not index this page in search engines.
                </label>
                <AdminKeyValueEditor
                  disabled={!hasManagePermission}
                  hint="Optional extra SEO fields if your backend consumers use additional metadata keys."
                  label="Extra SEO fields"
                  rows={form.seoExtraRows}
                  onChange={(rows) => setForm((current) => ({ ...current, seoExtraRows: rows }))}
                />
              </div>
            </section>
          </div>
        ) : null}

        {collection === "banners" ? (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminSelect
                disabled={!hasManagePermission}
                label="Placement"
                value={form.placement}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    placement: event.target.value as CmsBannerPlacement,
                  }))
                }
              >
                {CMS_PLACEMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </AdminSelect>
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Subtitle / eyebrow"
                storage="html"
                value={form.subtitle}
                onChange={(value) => setForm((current) => ({ ...current, subtitle: value }))}
              />
            </div>

            <AdminRichHtmlField
              disabled={!hasManagePermission}
              label="Banner body"
              value={form.bannerBodyHtml}
              onChange={(value) =>
                setForm((current) => ({ ...current, bannerBodyHtml: value }))
              }
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Primary CTA label"
                storage="html"
                value={form.ctaLabel}
                onChange={(value) => setForm((current) => ({ ...current, ctaLabel: value }))}
              />
              <AdminInput
                disabled={!hasManagePermission}
                label="Primary CTA link"
                value={form.ctaHref}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaHref: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Secondary CTA label"
                storage="html"
                value={form.bannerSecondaryCtaLabel}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    bannerSecondaryCtaLabel: value,
                  }))
                }
              />
              <AdminInput
                disabled={!hasManagePermission}
                label="Secondary CTA link"
                value={form.bannerSecondaryCtaHref}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bannerSecondaryCtaHref: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminInput
                disabled={!hasManagePermission}
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
              <AdminInput
                disabled={!hasManagePermission}
                label="Ends at"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </div>

            <AdminCmsStatsEditor
              disabled={!hasManagePermission}
              hint="These values appear as the hero stat chips."
              label="Hero highlights"
              rows={form.bannerStatsRows}
              onChange={(rows) => setForm((current) => ({ ...current, bannerStatsRows: rows }))}
            />

            <AdminKeyValueEditor
              disabled={!hasManagePermission}
              hint="Optional extra banner metadata beyond the built-in CTA and stats fields."
              label="Extra banner fields"
              rows={form.bannerMetaRows}
              onChange={(rows) => setForm((current) => ({ ...current, bannerMetaRows: rows }))}
            />
          </div>
        ) : null}

        {collection === "announcements" ? (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminSelect
                disabled={!hasManagePermission}
                label="Level"
                value={form.level}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    level: event.target.value as CmsAnnouncementLevel,
                  }))
                }
              >
                {ANNOUNCEMENT_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </AdminSelect>

              <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
                <input
                  checked={form.isPinned}
                  disabled={!hasManagePermission}
                  type="checkbox"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                    }))
                  }
                />
                Pin this announcement above the rest.
              </label>
            </div>

            <AdminRichHtmlField
              disabled={!hasManagePermission}
              label="Announcement body"
              value={form.announcementBodyHtml}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  announcementBodyHtml: value,
                }))
              }
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Link label"
                storage="html"
                value={form.linkLabel}
                onChange={(value) => setForm((current) => ({ ...current, linkLabel: value }))}
              />
              <AdminInput
                disabled={!hasManagePermission}
                label="Link"
                value={form.linkHref}
                onChange={(event) =>
                  setForm((current) => ({ ...current, linkHref: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminInput
                disabled={!hasManagePermission}
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startsAt: event.target.value }))
                }
              />
              <AdminInput
                disabled={!hasManagePermission}
                label="Ends at"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </div>

            <AdminKeyValueEditor
              disabled={!hasManagePermission}
              hint="Optional delivery metadata like audience tags or internal notes."
              label="Extra announcement fields"
              rows={form.announcementMetaRows}
              onChange={(rows) =>
                setForm((current) => ({ ...current, announcementMetaRows: rows }))
              }
            />
          </div>
        ) : null}

        {collection === "sections" ? (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <AdminInput
                disabled={!hasManagePermission}
                hint="Stable identifier used by the landing or student surfaces."
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
              <AdminSelect
                disabled={!hasManagePermission}
                label="Surface"
                value={form.surface}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    surface: event.target.value as CmsSectionSurface,
                  }))
                }
              >
                {CMS_SURFACE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getCmsSurfaceLabel(option)}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                disabled={!hasManagePermission}
                label="Section type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as CmsSectionType,
                  }))
                }
              >
                {CMS_SECTION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getCmsSectionTypeLabel(option)}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Subtitle"
                storage="html"
                value={form.subtitle}
                onChange={(value) => setForm((current) => ({ ...current, subtitle: value }))}
              />
              <AdminFontTextField
                disabled={!hasManagePermission}
                label="Eyebrow"
                storage="html"
                value={form.eyeBrow}
                onChange={(value) => setForm((current) => ({ ...current, eyeBrow: value }))}
              />
            </div>

            {form.type === "RICH_TEXT" ? (
              <>
                <AdminRichHtmlField
                  disabled={!hasManagePermission}
                  label="Section body"
                  value={form.sectionRichTextHtml}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, sectionRichTextHtml: value }))
                  }
                />
                <AdminCmsStatsEditor
                  disabled={!hasManagePermission}
                  hint="Optional right-hand highlight boxes for rich text sections."
                  label="Highlights"
                  rows={form.sectionStatsRows}
                  onChange={(rows) =>
                    setForm((current) => ({ ...current, sectionStatsRows: rows }))
                  }
                />
              </>
            ) : null}

            {form.type === "CONTENT_FEED" ? (
              <>
                <AdminInput
                  disabled={!hasManagePermission}
                  hint="Use 2 or 3 columns on desktop."
                  label="Desktop columns"
                  type="number"
                  min={2}
                  max={3}
                  value={form.columns}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, columns: event.target.value }))
                  }
                />
                <AdminCmsFeedItemsEditor
                  disabled={!hasManagePermission}
                  hint="These cards appear in the public section grid."
                  label="Cards"
                  rows={form.sectionFeedRows}
                  onChange={(rows) =>
                    setForm((current) => ({ ...current, sectionFeedRows: rows }))
                  }
                />
              </>
            ) : null}

            {form.type === "PLAN_HIGHLIGHTS" ? (
              <AdminFontTextField
                disabled={!hasManagePermission}
                hint="Support copy shown above the plan cards."
                label="Plan note"
                multiline
                preserveParagraphs
                rows={4}
                storage="html"
                value={form.note}
                onChange={(value) => setForm((current) => ({ ...current, note: value }))}
              />
            ) : null}

            {form.type === "CTA_GROUP" ? (
              <AdminCmsCtaEditor
                disabled={!hasManagePermission}
                hint="Each action becomes a CTA card with a button."
                label="Actions"
                rows={form.sectionCtaRows}
                onChange={(rows) =>
                  setForm((current) => ({ ...current, sectionCtaRows: rows }))
                }
              />
            ) : null}

            <AdminKeyValueEditor
              disabled={!hasManagePermission}
              hint="Optional extra section config fields kept alongside the friendly controls."
              label="Extra section config"
              rows={form.sectionConfigRows}
              onChange={(rows) =>
                setForm((current) => ({ ...current, sectionConfigRows: rows }))
              }
            />
          </div>
        ) : null}
      </section>

      <AdminAssetUploader
        accessLevel="PUBLIC"
        assetId={form.imageAssetId}
        currentAsset={currentAsset}
        label={collection === "pages" ? "Cover image" : "Display image"}
        onAssetChange={(asset) => {
          setCurrentAsset(asset)
          setForm((current) => ({
            ...current,
            imageAssetId: asset?.id ?? "",
          }))
        }}
      />
    </div>
  )
}
