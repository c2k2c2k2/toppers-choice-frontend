"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
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
  safeJsonParse,
  stringifyJsonInput,
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
} from "@/lib/admin";
import { AdminAnnouncementLevelBadge, AdminStatusBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { AdminAssetUploader } from "@/components/admin/admin-asset-uploader";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

const CMS_STATUS_OPTIONS: CmsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const CMS_VISIBILITY_OPTIONS: CmsVisibility[] = [
  "PUBLIC",
  "AUTHENTICATED",
  "INTERNAL",
];
const CMS_PLACEMENT_OPTIONS: CmsBannerPlacement[] = [
  "LANDING_HOME",
  "STUDENT_HOME",
  "COMMON",
];
const CMS_SURFACE_OPTIONS: CmsSectionSurface[] = [
  "LANDING_HOME",
  "STUDENT_HOME",
];
const CMS_SECTION_TYPE_OPTIONS: CmsSectionType[] = [
  "RICH_TEXT",
  "CONTENT_FEED",
  "PLAN_HIGHLIGHTS",
  "CTA_GROUP",
];
const ANNOUNCEMENT_LEVEL_OPTIONS: CmsAnnouncementLevel[] = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "CRITICAL",
];

interface CmsEditorFormState {
  bodyJsonText: string;
  bodyText: string;
  code: string;
  ctaHref: string;
  ctaLabel: string;
  endsAt: string;
  imageAssetId: string;
  isPinned: boolean;
  level: CmsAnnouncementLevel;
  linkHref: string;
  linkLabel: string;
  metaJsonText: string;
  orderIndex: string;
  placement: CmsBannerPlacement;
  seoJsonText: string;
  slug: string;
  startsAt: string;
  subtitle: string;
  summary: string;
  surface: CmsSectionSurface;
  title: string;
  type: CmsSectionType;
  visibility: CmsVisibility;
  configJsonText: string;
}

const EMPTY_FORM_STATE: CmsEditorFormState = {
  bodyJsonText: "",
  bodyText: "",
  code: "",
  configJsonText: "",
  ctaHref: "",
  ctaLabel: "",
  endsAt: "",
  imageAssetId: "",
  isPinned: false,
  level: "INFO",
  linkHref: "",
  linkLabel: "",
  metaJsonText: "",
  orderIndex: "",
  placement: "LANDING_HOME",
  seoJsonText: "",
  slug: "",
  startsAt: "",
  subtitle: "",
  summary: "",
  surface: "LANDING_HOME",
  title: "",
  type: "RICH_TEXT",
  visibility: "PUBLIC",
};

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function toOrderIndex(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asSchemaJson(
  value: Record<string, unknown> | null | undefined,
) {
  return value as Record<string, never> | undefined;
}

function asRequiredSchemaJson(
  value: Record<string, unknown> | null | undefined,
) {
  return value as Record<string, never>;
}

function buildFormState(record: CmsRecord | null): CmsEditorFormState {
  if (!record) {
    return EMPTY_FORM_STATE;
  }

  if ("slug" in record) {
    return {
      ...EMPTY_FORM_STATE,
      bodyJsonText: stringifyJsonInput(record.bodyJson),
      imageAssetId:
        typeof record.coverImageAssetId === "string" ? record.coverImageAssetId : "",
      orderIndex: String(record.orderIndex),
      seoJsonText: stringifyJsonInput(record.seoJson),
      slug: record.slug,
      summary: typeof record.summary === "string" ? record.summary : "",
      title: record.title,
      visibility: record.visibility,
    };
  }

  if ("placement" in record) {
    return {
      ...EMPTY_FORM_STATE,
      bodyText: typeof record.body === "string" ? record.body : "",
      ctaHref: typeof record.ctaHref === "string" ? record.ctaHref : "",
      ctaLabel: typeof record.ctaLabel === "string" ? record.ctaLabel : "",
      endsAt: toDatetimeLocalValue(
        typeof record.endsAt === "string" ? record.endsAt : null,
      ),
      imageAssetId:
        typeof record.imageAssetId === "string" ? record.imageAssetId : "",
      metaJsonText: stringifyJsonInput(record.metaJson),
      orderIndex: String(record.orderIndex),
      placement: record.placement,
      startsAt: toDatetimeLocalValue(
        typeof record.startsAt === "string" ? record.startsAt : null,
      ),
      subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
      title: record.title,
      visibility: record.visibility,
    };
  }

  if ("level" in record) {
    return {
      ...EMPTY_FORM_STATE,
      bodyText: record.body,
      endsAt: toDatetimeLocalValue(
        typeof record.endsAt === "string" ? record.endsAt : null,
      ),
      isPinned: record.isPinned,
      level: record.level,
      linkHref: typeof record.linkHref === "string" ? record.linkHref : "",
      linkLabel: typeof record.linkLabel === "string" ? record.linkLabel : "",
      metaJsonText: stringifyJsonInput(record.metaJson),
      orderIndex: String(record.orderIndex),
      startsAt: toDatetimeLocalValue(
        typeof record.startsAt === "string" ? record.startsAt : null,
      ),
      title: record.title,
      visibility: record.visibility,
    };
  }

  return {
    ...EMPTY_FORM_STATE,
    bodyJsonText: stringifyJsonInput(record.bodyJson),
    configJsonText: stringifyJsonInput(record.configJson),
    code: record.code,
    imageAssetId: typeof record.imageAssetId === "string" ? record.imageAssetId : "",
    orderIndex: String(record.orderIndex),
    subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
    surface: record.surface,
    title: record.title,
    type: record.type,
    visibility: record.visibility,
  };
}

function sortRecords(records: CmsRecord[], orderedIds: string[]) {
  if (orderedIds.length === 0) {
    return [...records].sort((left, right) => left.orderIndex - right.orderIndex);
  }

  const orderLookup = new Map(orderedIds.map((id, index) => [id, index]));

  return [...records].sort((left, right) => {
    const leftIndex = orderLookup.get(left.id);
    const rightIndex = orderLookup.get(right.id);

    if (leftIndex === undefined && rightIndex === undefined) {
      return left.orderIndex - right.orderIndex;
    }

    if (leftIndex === undefined) {
      return 1;
    }

    if (rightIndex === undefined) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function moveRecord(ids: string[], targetId: string, direction: -1 | 1) {
  const currentIndex = ids.indexOf(targetId);

  if (currentIndex < 0) {
    return ids;
  }

  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= ids.length) {
    return ids;
  }

  const nextIds = [...ids];
  const [moved] = nextIds.splice(currentIndex, 1);
  nextIds.splice(nextIndex, 0, moved);
  return nextIds;
}

function hasMatchingOrder(ids: string[], records: CmsRecord[]) {
  if (ids.length !== records.length) {
    return false;
  }

  const recordIds = new Set(records.map((record) => record.id));
  return ids.every((id) => recordIds.has(id));
}

function buildCollectionQuery(
  collection: CmsCollection,
  filters: {
    placement: string;
    search: string;
    status: string;
    surface: string;
    visibility: string;
  },
): NonNullable<CmsListQuery> {
  return {
    placement: collection === "banners" ? (filters.placement as CmsBannerPlacement) : undefined,
    q: filters.search.trim() || undefined,
    status: filters.status ? (filters.status as CmsStatus) : undefined,
    surface: collection === "sections" ? (filters.surface as CmsSectionSurface) : undefined,
    visibility: filters.visibility ? (filters.visibility as CmsVisibility) : undefined,
  };
}

export function AdminCmsManagementScreen({
  collection,
}: Readonly<{
  collection: CmsCollection;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [placement, setPlacement] = useState("");
  const [surface, setSurface] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<CmsEditorFormState | null>(null);
  const [editorAsset, setEditorAsset] = useState<{
    accessLevel?: string;
    contentType?: string;
    id: string;
    originalFileName: string;
    publicDeliveryPath?: string;
    status?: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);

  const hasManagePermission = authSession.hasPermission("content.cms.manage");
  const hasPublishPermission = authSession.hasPermission("content.cms.publish");

  const filters = useMemo(
    () =>
      buildCollectionQuery(collection, {
        placement,
        search,
        status,
        surface,
        visibility,
      }),
    [collection, placement, search, status, surface, visibility],
  );

  const listQuery = useAuthenticatedQuery({
    queryFn: async (accessToken) => {
      switch (collection) {
        case "pages":
          return listAdminCmsPages(accessToken, filters);
        case "banners":
          return listAdminCmsBanners(accessToken, filters);
        case "announcements":
          return listAdminCmsAnnouncements(accessToken, filters);
        case "sections":
          return listAdminCmsSections(accessToken, filters);
      }
    },
    queryKey: queryKeys.admin.cms(collection, filters),
    staleTime: 15_000,
  });

  const records = useMemo(() => (listQuery.data?.items ?? []) as CmsRecord[], [listQuery.data]);
  const defaultOrderIds = useMemo(
    () =>
      records
        .slice()
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((record) => record.id),
    [records],
  );
  const effectiveOrderIds = useMemo(
    () => (hasMatchingOrder(orderIds, records) ? orderIds : defaultOrderIds),
    [defaultOrderIds, orderIds, records],
  );
  const sortedRecords = useMemo(
    () => sortRecords(records, effectiveOrderIds),
    [effectiveOrderIds, records],
  );
  const selectedRecord = useMemo(() => {
    if (isCreating) {
      return null;
    }

    if (selectedRecordId) {
      return (
        sortedRecords.find((record) => record.id === selectedRecordId) ??
        sortedRecords[0] ??
        null
      );
    }

    return sortedRecords[0] ?? null;
  }, [isCreating, selectedRecordId, sortedRecords]);
  const hasExplicitSelection =
    Boolean(selectedRecordId) &&
    sortedRecords.some((record) => record.id === selectedRecordId);
  const activeEditorState =
    isCreating || hasExplicitSelection
      ? (editorState ?? buildFormState(selectedRecord))
      : buildFormState(selectedRecord);
  const activeEditorAsset =
    isCreating || hasExplicitSelection
      ? (editorAsset ?? getCmsRecordAsset(selectedRecord) ?? null)
      : (getCmsRecordAsset(selectedRecord) ?? null);

  async function invalidateCollection() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.admin.cms(collection, filters),
    });
  }

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (_: undefined, accessToken) => {
      switch (collection) {
        case "pages": {
          const payload = {
            slug: activeEditorState.slug.trim(),
            title: activeEditorState.title.trim(),
            summary: activeEditorState.summary.trim() || undefined,
            bodyJson: asRequiredSchemaJson(
              safeJsonParse(activeEditorState.bodyJsonText, {
                label: "Body JSON",
              }),
            ),
            seoJson: asSchemaJson(
              safeJsonParse(activeEditorState.seoJsonText, {
                allowEmpty: true,
                label: "SEO JSON",
              }) ?? undefined,
            ),
            visibility: activeEditorState.visibility,
            coverImageAssetId: activeEditorState.imageAssetId.trim() || undefined,
            orderIndex: toOrderIndex(activeEditorState.orderIndex),
          };

          return selectedRecord
            ? updateAdminCmsPage(selectedRecord.id, payload, accessToken)
            : createAdminCmsPage(payload, accessToken);
        }

        case "banners": {
          const payload = {
            placement: activeEditorState.placement,
            title: activeEditorState.title.trim(),
            subtitle: activeEditorState.subtitle.trim() || undefined,
            body: activeEditorState.bodyText.trim() || undefined,
            ctaLabel: activeEditorState.ctaLabel.trim() || undefined,
            ctaHref: activeEditorState.ctaHref.trim() || undefined,
            imageAssetId: activeEditorState.imageAssetId.trim() || undefined,
            visibility: activeEditorState.visibility,
            orderIndex: toOrderIndex(activeEditorState.orderIndex),
            startsAt: toIsoDateTime(activeEditorState.startsAt),
            endsAt: toIsoDateTime(activeEditorState.endsAt),
            metaJson: asSchemaJson(
              safeJsonParse(activeEditorState.metaJsonText, {
                allowEmpty: true,
                label: "Meta JSON",
              }) ?? undefined,
            ),
          };

          return selectedRecord
            ? updateAdminCmsBanner(selectedRecord.id, payload, accessToken)
            : createAdminCmsBanner(payload, accessToken);
        }

        case "announcements": {
          const payload = {
            title: activeEditorState.title.trim(),
            body: activeEditorState.bodyText.trim(),
            linkLabel: activeEditorState.linkLabel.trim() || undefined,
            linkHref: activeEditorState.linkHref.trim() || undefined,
            level: activeEditorState.level,
            visibility: activeEditorState.visibility,
            isPinned: activeEditorState.isPinned,
            orderIndex: toOrderIndex(activeEditorState.orderIndex),
            startsAt: toIsoDateTime(activeEditorState.startsAt),
            endsAt: toIsoDateTime(activeEditorState.endsAt),
            metaJson: asSchemaJson(
              safeJsonParse(activeEditorState.metaJsonText, {
                allowEmpty: true,
                label: "Meta JSON",
              }) ?? undefined,
            ),
          };

          return selectedRecord
            ? updateAdminCmsAnnouncement(selectedRecord.id, payload, accessToken)
            : createAdminCmsAnnouncement(payload, accessToken);
        }

        case "sections": {
          const payload = {
            surface: activeEditorState.surface,
            code: activeEditorState.code.trim(),
            title: activeEditorState.title.trim(),
            subtitle: activeEditorState.subtitle.trim() || undefined,
            type: activeEditorState.type,
            bodyJson: asSchemaJson(
              safeJsonParse(activeEditorState.bodyJsonText, {
                allowEmpty: true,
                label: "Body JSON",
              }) ?? undefined,
            ),
            configJson: asSchemaJson(
              safeJsonParse(activeEditorState.configJsonText, {
                allowEmpty: true,
                label: "Config JSON",
              }) ?? undefined,
            ),
            imageAssetId: activeEditorState.imageAssetId.trim() || undefined,
            visibility: activeEditorState.visibility,
            orderIndex: toOrderIndex(activeEditorState.orderIndex),
          };

          return selectedRecord
            ? updateAdminCmsSection(selectedRecord.id, payload, accessToken)
            : createAdminCmsSection(payload, accessToken);
        }
      }
    },
    onSuccess: async (record) => {
      setMessage(
        selectedRecord
          ? `${getCmsCollectionLabel(collection)} record updated successfully.`
          : `${getCmsCollectionLabel(collection)} record created successfully.`,
      );
      setIsCreating(false);
      setSelectedRecordId(record.id);
      setEditorState(buildFormState(record));
      setEditorAsset(getCmsRecordAsset(record) ?? null);
      await invalidateCollection();
    },
  });

  const publishMutation = useAuthenticatedMutation({
    mutationFn: async (_: undefined, accessToken) => {
      if (!selectedRecord) {
        throw new Error("Select a record before changing publish status.");
      }

      switch (collection) {
        case "pages":
          return isCmsRecordPublished(selectedRecord)
            ? unpublishAdminCmsPage(selectedRecord.id, accessToken)
            : publishAdminCmsPage(selectedRecord.id, accessToken);
        case "banners":
          return isCmsRecordPublished(selectedRecord)
            ? unpublishAdminCmsBanner(selectedRecord.id, accessToken)
            : publishAdminCmsBanner(selectedRecord.id, accessToken);
        case "announcements":
          return isCmsRecordPublished(selectedRecord)
            ? unpublishAdminCmsAnnouncement(selectedRecord.id, accessToken)
            : publishAdminCmsAnnouncement(selectedRecord.id, accessToken);
        case "sections":
          return isCmsRecordPublished(selectedRecord)
            ? unpublishAdminCmsSection(selectedRecord.id, accessToken)
            : publishAdminCmsSection(selectedRecord.id, accessToken);
      }
    },
    onSuccess: async (record) => {
      setMessage(
        isCmsRecordPublished(record)
          ? `${record.title} is now published.`
          : `${record.title} is back in draft mode.`,
      );
      setIsCreating(false);
      setEditorState(buildFormState(record));
      setEditorAsset(getCmsRecordAsset(record) ?? null);
      await invalidateCollection();
    },
  });

  const reorderMutation = useAuthenticatedMutation({
    mutationFn: async (_: undefined, accessToken) => {
      const payload = {
        orderedIds: effectiveOrderIds,
      };

      switch (collection) {
        case "pages":
          return reorderAdminCmsPages(payload, accessToken);
        case "banners":
          return reorderAdminCmsBanners(payload, accessToken);
        case "announcements":
          return reorderAdminCmsAnnouncements(payload, accessToken);
        case "sections":
          return reorderAdminCmsSections(payload, accessToken);
      }
    },
    onSuccess: async () => {
      setMessage(`${getCmsCollectionLabel(collection)} order synced with the backend.`);
      await invalidateCollection();
    },
  });

  if (listQuery.isLoading) {
    return (
      <LoadingState
        title={`Loading ${getCmsCollectionLabel(collection).toLowerCase()}`}
        description="Fetching the current CMS records, filters, and editor context for the admin workspace."
      />
    );
  }

  if (listQuery.error) {
    return (
      <ErrorState
        title={`The ${getCmsCollectionLabel(collection).toLowerCase()} workspace could not be loaded.`}
        description="The shared admin shell is up, but the CMS collection request failed."
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow={`${getCmsCollectionLabel(collection)} management`}
        title={`${getCmsCollectionLabel(collection)} now run through a shared CRUD foundation.`}
        description="Search, filter, reorder, edit, upload assets, and publish CMS records from the same admin workflow that later domains will reuse."
        actions={
          <>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => {
                setMessage(null);
                setIsCreating(true);
                setSelectedRecordId(null);
                setEditorState(buildFormState(null));
                setEditorAsset(null);
              }}
            >
              New record
            </button>
            <button
              type="button"
              className="tc-button-primary"
              disabled={
                !hasManagePermission ||
                reorderMutation.isPending ||
                effectiveOrderIds.length === 0
              }
              onClick={() => reorderMutation.mutate(undefined)}
            >
              {reorderMutation.isPending ? "Saving order..." : "Sync order"}
            </button>
          </>
        }
      />

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
            "The CMS record publish state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}
      {!hasManagePermission ? (
        <AdminInlineNotice>
          This session can view CMS records but cannot edit them. Backend permissions still decide actual write access.
        </AdminInlineNotice>
      ) : null}

      <AdminFilterBar
        searchValue={search}
        onSearchValueChange={setSearch}
        resultSummary={`${records.length} records returned from the backend contract for this collection.`}
        actions={
          <button
            type="button"
            className="tc-button-secondary"
            onClick={() => {
              setSearch("");
              setStatus("");
              setVisibility("");
              setPlacement("");
              setSurface("");
            }}
          >
            Reset filters
          </button>
        }
      >
        <label className="tc-form-field min-w-40 flex-1">
          <span className="tc-form-label">Status</span>
          <select
            className="tc-input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {CMS_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="tc-form-field min-w-40 flex-1">
          <span className="tc-form-label">Visibility</span>
          <select
            className="tc-input"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
          >
            <option value="">All visibility</option>
            {CMS_VISIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {collection === "banners" ? (
          <label className="tc-form-field min-w-40 flex-1">
            <span className="tc-form-label">Placement</span>
            <select
              className="tc-input"
              value={placement}
              onChange={(event) => setPlacement(event.target.value)}
            >
              <option value="">All placements</option>
              {CMS_PLACEMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {collection === "sections" ? (
          <label className="tc-form-field min-w-40 flex-1">
            <span className="tc-form-label">Surface</span>
            <select
              className="tc-input"
              value={surface}
              onChange={(event) => setSurface(event.target.value)}
            >
              <option value="">All surfaces</option>
              {CMS_SURFACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </AdminFilterBar>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <AdminDataTable
            columns={[
              {
                header: "Record",
                render: (record: CmsRecord) => (
                  <div className="space-y-2">
                    <p className="font-semibold text-[color:var(--brand)]">
                      {record.title}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {summarizeCmsRecord(record)}
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
                header: "Schedule",
                render: (record: CmsRecord) => (
                  <div className="space-y-2 text-xs text-[color:var(--muted)]">
                    <p>Order #{record.orderIndex}</p>
                    <p>
                      {"publishedAt" in record
                        ? formatAdminDateTime(
                            typeof record.publishedAt === "string" ? record.publishedAt : null,
                          )
                        : "Not published"}
                    </p>
                  </div>
                ),
              },
              {
                header: "Actions",
                render: (record: CmsRecord) => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="tc-button-secondary"
                      onClick={() => {
                        setMessage(null);
                        setIsCreating(false);
                        setSelectedRecordId(record.id);
                        setEditorState(buildFormState(record));
                        setEditorAsset(getCmsRecordAsset(record) ?? null);
                      }}
                    >
                      Edit
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
                title={`No ${getCmsCollectionLabel(collection).toLowerCase()} match the current filters.`}
                description="Reset the filters or create the first record for this CMS collection."
              />
            }
            getRowId={(record: CmsRecord) => record.id}
            onRowClick={(record: CmsRecord) => {
              setMessage(null);
              setIsCreating(false);
              setSelectedRecordId(record.id);
              setEditorState(buildFormState(record));
              setEditorAsset(getCmsRecordAsset(record) ?? null);
            }}
            rows={sortedRecords}
            selectedRowId={selectedRecord?.id ?? null}
          />
        </div>

        <section className="tc-card rounded-[28px] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
                {selectedRecord ? "Editing record" : "Create record"}
              </p>
              <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
                {selectedRecord
                  ? selectedRecord.title
                  : `New ${getCmsCollectionLabel(collection).slice(0, -1).toLowerCase()}`}
              </h2>
              <p className="tc-muted mt-2 text-sm leading-6">
                This editor stays contract-driven against the backend DTOs and publish workflow.
              </p>
            </div>
            {selectedRecord ? (
              <div className="flex flex-wrap gap-2">
                <AdminStatusBadge status={selectedRecord.status} />
                <AdminVisibilityBadge visibility={selectedRecord.visibility} />
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            <AdminInput
              label="Title"
              value={activeEditorState.title}
              disabled={!hasManagePermission}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...(current ?? buildFormState(selectedRecord)),
                  title: event.target.value,
                }))
              }
            />

            {collection === "pages" ? (
              <>
                <AdminInput
                  label="Slug"
                  hint="Used for public page routes like /about or /privacy."
                  value={activeEditorState.slug}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      slug: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Summary"
                  rows={3}
                  value={activeEditorState.summary}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      summary: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Body JSON"
                  rows={8}
                  hint="Use block JSON compatible with the shared frontend section renderer."
                  value={activeEditorState.bodyJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      bodyJsonText: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="SEO JSON"
                  rows={5}
                  value={activeEditorState.seoJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      seoJsonText: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            {collection === "banners" ? (
              <>
                <AdminSelect
                  label="Placement"
                  value={activeEditorState.placement}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
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
                <AdminInput
                  label="Subtitle"
                  value={activeEditorState.subtitle}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      subtitle: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Body copy"
                  rows={4}
                  value={activeEditorState.bodyText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      bodyText: event.target.value,
                    }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminInput
                    label="CTA label"
                    value={activeEditorState.ctaLabel}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        ctaLabel: event.target.value,
                      }))
                    }
                  />
                  <AdminInput
                    label="CTA href"
                    value={activeEditorState.ctaHref}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        ctaHref: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Starts at"
                    type="datetime-local"
                    value={activeEditorState.startsAt}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        startsAt: event.target.value,
                      }))
                    }
                  />
                  <AdminInput
                    label="Ends at"
                    type="datetime-local"
                    value={activeEditorState.endsAt}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        endsAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <AdminTextarea
                  label="Meta JSON"
                  rows={5}
                  value={activeEditorState.metaJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      metaJsonText: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            {collection === "announcements" ? (
              <>
                <AdminTextarea
                  label="Announcement body"
                  rows={4}
                  value={activeEditorState.bodyText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      bodyText: event.target.value,
                    }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminSelect
                    label="Level"
                    value={activeEditorState.level}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
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
                  <label className="tc-form-field">
                    <span className="tc-form-label">Pinned</span>
                    <button
                      type="button"
                      className="tc-button-secondary justify-start"
                      disabled={!hasManagePermission}
                      onClick={() =>
                        setEditorState((current) => ({
                          ...(current ?? buildFormState(selectedRecord)),
                          isPinned: !(current ?? buildFormState(selectedRecord)).isPinned,
                        }))
                      }
                    >
                      {activeEditorState.isPinned ? "Pinned announcement" : "Not pinned"}
                    </button>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Link label"
                    value={activeEditorState.linkLabel}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        linkLabel: event.target.value,
                      }))
                    }
                  />
                  <AdminInput
                    label="Link href"
                    value={activeEditorState.linkHref}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        linkHref: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Starts at"
                    type="datetime-local"
                    value={activeEditorState.startsAt}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        startsAt: event.target.value,
                      }))
                    }
                  />
                  <AdminInput
                    label="Ends at"
                    type="datetime-local"
                    value={activeEditorState.endsAt}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        endsAt: event.target.value,
                      }))
                    }
                  />
                </div>
                <AdminTextarea
                  label="Meta JSON"
                  rows={5}
                  value={activeEditorState.metaJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      metaJsonText: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            {collection === "sections" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminInput
                    label="Code"
                    hint="Used as the stable identifier for stitched home sections."
                    value={activeEditorState.code}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
                        code: event.target.value,
                      }))
                    }
                  />
                  <AdminSelect
                    label="Surface"
                    value={activeEditorState.surface}
                    disabled={!hasManagePermission}
                    onChange={(event) =>
                      setEditorState((current) => ({
                        ...(current ?? buildFormState(selectedRecord)),
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
                </div>
                <AdminInput
                  label="Subtitle"
                  value={activeEditorState.subtitle}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      subtitle: event.target.value,
                    }))
                  }
                />
                <AdminSelect
                  label="Section type"
                  value={activeEditorState.type}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
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
                <AdminTextarea
                  label="Body JSON"
                  rows={7}
                  value={activeEditorState.bodyJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      bodyJsonText: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Config JSON"
                  rows={6}
                  value={activeEditorState.configJsonText}
                  disabled={!hasManagePermission}
                  onChange={(event) =>
                    setEditorState((current) => ({
                      ...(current ?? buildFormState(selectedRecord)),
                      configJsonText: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <AdminSelect
                label="Visibility"
                value={activeEditorState.visibility}
                disabled={!hasManagePermission}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...(current ?? buildFormState(selectedRecord)),
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
              <AdminInput
                label="Order index"
                type="number"
                value={activeEditorState.orderIndex}
                disabled={!hasManagePermission}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...(current ?? buildFormState(selectedRecord)),
                    orderIndex: event.target.value,
                  }))
                }
              />
            </div>

            {collection !== "announcements" ? (
              <AdminAssetUploader
                assetId={activeEditorState.imageAssetId}
                currentAsset={activeEditorAsset}
                label={collection === "pages" ? "Cover image" : "Image asset"}
                onAssetChange={(asset) => {
                  setEditorAsset(asset);
                  setEditorState((current) => ({
                    ...(current ?? buildFormState(selectedRecord)),
                    imageAssetId: asset?.id ?? "",
                  }));
                }}
              />
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-[rgba(0,30,64,0.08)] pt-4">
              <button
                type="button"
                className="tc-button-primary"
                disabled={!hasManagePermission || saveMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  saveMutation.mutate(undefined);
                }}
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
                disabled={!selectedRecord || !hasPublishPermission || publishMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  publishMutation.mutate(undefined);
                }}
              >
                {publishMutation.isPending
                  ? "Updating..."
                  : selectedRecord && isCmsRecordPublished(selectedRecord)
                    ? "Unpublish"
                    : "Publish"}
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => {
                  setMessage(null);
                  setEditorState(buildFormState(selectedRecord));
                  setEditorAsset(getCmsRecordAsset(selectedRecord) ?? null);
                }}
              >
                Reset editor
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
