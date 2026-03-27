"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { buildApiUrl } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  cancelAdminNotificationBroadcast,
  createAdminNotificationBroadcast,
  createAdminNotificationTemplate,
  dispatchAdminNotificationBroadcast,
  getAdminAnalyticsOverview,
  getAdminContentHealth,
  getAdminOpsDashboard,
  getApiErrorMessage,
  listAdminNoteSecuritySignals,
  listAdminNotificationBroadcasts,
  listAdminNotificationMessages,
  listAdminNotificationTemplates,
  revokeAdminNoteViewSession,
  searchAdminWorkspace,
  updateAdminNotificationBroadcast,
  updateAdminNotificationTemplate,
  type NotificationBroadcastAudience,
  type NotificationBroadcastStatus,
  type NotificationChannel,
  type NotificationMessageStatus,
  type NotificationTemplateStatus,
  type SecuritySignalSeverity,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type InsightsTab = "notifications" | "analytics" | "ops";

interface NotificationTemplateFormState {
  bodyTemplate: string;
  channel: NotificationChannel;
  key: string;
  metaJson: string;
  name: string;
  status: NotificationTemplateStatus;
  subjectTemplate: string;
  titleTemplate: string;
}

interface NotificationBroadcastFormState {
  audienceType: NotificationBroadcastAudience;
  body: string;
  channel: NotificationChannel;
  filtersJson: string;
  payloadJson: string;
  scheduledAt: string;
  templateId: string;
  title: string;
}

const TEMPLATE_STATUS_OPTIONS: NotificationTemplateStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];
const NOTIFICATION_CHANNEL_OPTIONS: NotificationChannel[] = ["IN_APP", "EMAIL", "SMS"];
const BROADCAST_STATUS_OPTIONS: NotificationBroadcastStatus[] = [
  "DRAFT",
  "QUEUED",
  "SENT",
  "CANCELLED",
  "FAILED",
];
const BROADCAST_AUDIENCE_OPTIONS: NotificationBroadcastAudience[] = [
  "ALL_STUDENTS",
  "ALL_ADMINS",
  "USER_IDS",
  "ACTIVE_SUBSCRIBERS",
];
const MESSAGE_STATUS_OPTIONS: NotificationMessageStatus[] = [
  "PENDING",
  "DELIVERED",
  "READ",
  "FAILED",
  "CANCELLED",
];
const SECURITY_SEVERITY_OPTIONS: SecuritySignalSeverity[] = ["LOW", "MEDIUM", "HIGH"];
const NEW_TEMPLATE_DRAFT_ID = "__new-template__";
const NEW_BROADCAST_DRAFT_ID = "__new-broadcast__";

const EMPTY_TEMPLATE_FORM_STATE: NotificationTemplateFormState = {
  bodyTemplate: "",
  channel: "IN_APP",
  key: "",
  metaJson: "",
  name: "",
  status: "ACTIVE",
  subjectTemplate: "",
  titleTemplate: "",
};

const EMPTY_BROADCAST_FORM_STATE: NotificationBroadcastFormState = {
  audienceType: "ALL_STUDENTS",
  body: "",
  channel: "IN_APP",
  filtersJson: "",
  payloadJson: "",
  scheduledAt: "",
  templateId: "",
  title: "",
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

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function buildTemplateFormState(
  template:
    | Awaited<ReturnType<typeof listAdminNotificationTemplates>>["items"][number]
    | null,
): NotificationTemplateFormState {
  if (!template) {
    return EMPTY_TEMPLATE_FORM_STATE;
  }

  return {
    bodyTemplate: template.bodyTemplate,
    channel: template.channel,
    key: template.key,
    metaJson: JSON.stringify(template.metaJson ?? {}, null, 2),
    name: template.name,
    status: template.status,
    subjectTemplate:
      typeof template.subjectTemplate === "string" ? template.subjectTemplate : "",
    titleTemplate: template.titleTemplate,
  };
}

function buildBroadcastFormState(
  broadcast:
    | Awaited<ReturnType<typeof listAdminNotificationBroadcasts>>["items"][number]
    | null,
): NotificationBroadcastFormState {
  if (!broadcast) {
    return EMPTY_BROADCAST_FORM_STATE;
  }

  return {
    audienceType: broadcast.audienceType,
    body: broadcast.body,
    channel: broadcast.channel,
    filtersJson: JSON.stringify(broadcast.filtersJson ?? {}, null, 2),
    payloadJson: JSON.stringify(broadcast.payloadJson ?? {}, null, 2),
    scheduledAt: toDatetimeLocalValue(
      typeof broadcast.scheduledAt === "string" ? broadcast.scheduledAt : null,
    ),
    templateId: typeof broadcast.templateId === "string" ? broadcast.templateId : "",
    title: broadcast.title,
  };
}

export function AdminInsightsScreen({
  initialTab,
}: Readonly<{
  initialTab: InsightsTab;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const canReadNotifications = authSession.hasPermission("notifications.read");
  const canManageNotifications = authSession.hasPermission("notifications.manage");
  const canSendNotifications = authSession.hasPermission("notifications.send");
  const canReadAnalytics = authSession.hasPermission("analytics.read");
  const canReadSearch = authSession.hasPermission("admin.search.read");
  const canReadOps = authSession.hasPermission("admin.ops.read");
  const canExportOps = authSession.hasPermission("admin.ops.export");
  const canSupportOps = authSession.hasPermission("admin.ops.support");
  const canReadSecurity = authSession.hasPermission("admin.security.read");

  const [searchValue, setSearchValue] = useState("");
  const [templateStatus, setTemplateStatus] = useState<NotificationTemplateStatus | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateDrafts, setTemplateDrafts] = useState<
    Record<string, NotificationTemplateFormState>
  >(
    {},
  );
  const [broadcastStatus, setBroadcastStatus] = useState<NotificationBroadcastStatus | "">("");
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [broadcastDrafts, setBroadcastDrafts] = useState<
    Record<string, NotificationBroadcastFormState>
  >(
    {},
  );
  const [messageStatus, setMessageStatus] = useState<NotificationMessageStatus | "">("");
  const [securitySeverity, setSecuritySeverity] = useState<SecuritySignalSeverity | "">("");
  const [manualNoteViewSessionId, setManualNoteViewSessionId] = useState("");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const templatesQuery = useAuthenticatedQuery({
    enabled: initialTab === "notifications" && canReadNotifications,
    queryFn: (accessToken) =>
      listAdminNotificationTemplates(accessToken, {
        q: searchValue || undefined,
        status: templateStatus || undefined,
      }),
    queryKey: adminQueryKeys.notifications.templates({
      channel: null,
      q: searchValue || null,
      status: templateStatus || null,
    }),
    staleTime: 30_000,
  });

  const broadcastsQuery = useAuthenticatedQuery({
    enabled: initialTab === "notifications" && canReadNotifications,
    queryFn: (accessToken) =>
      listAdminNotificationBroadcasts(accessToken, {
        status: broadcastStatus || undefined,
      }),
    queryKey: adminQueryKeys.notifications.broadcasts({
      audienceType: null,
      channel: null,
      status: broadcastStatus || null,
    }),
    staleTime: 30_000,
  });

  const messagesQuery = useAuthenticatedQuery({
    enabled: initialTab === "notifications" && canReadNotifications,
    queryFn: (accessToken) =>
      listAdminNotificationMessages(accessToken, {
        status: messageStatus || undefined,
      }),
    queryKey: adminQueryKeys.notifications.messages({
      broadcastId: null,
      channel: null,
      status: messageStatus || null,
      userId: null,
    }),
    staleTime: 30_000,
  });

  const analyticsQuery = useAuthenticatedQuery({
    enabled: initialTab === "analytics" && canReadAnalytics,
    queryFn: getAdminAnalyticsOverview,
    queryKey: adminQueryKeys.analytics(),
    staleTime: 30_000,
  });

  const opsDashboardQuery = useAuthenticatedQuery({
    enabled: initialTab === "ops" && canReadOps,
    queryFn: getAdminOpsDashboard,
    queryKey: adminQueryKeys.dashboard(),
    staleTime: 30_000,
  });

  const contentHealthQuery = useAuthenticatedQuery({
    enabled: initialTab === "ops" && canReadOps,
    queryFn: getAdminContentHealth,
    queryKey: adminQueryKeys.contentHealth(),
    staleTime: 30_000,
  });

  const securitySignalsQuery = useAuthenticatedQuery({
    enabled: initialTab === "ops" && canReadSecurity,
    queryFn: (accessToken) =>
      listAdminNoteSecuritySignals(accessToken, {
        severity: securitySeverity || undefined,
        take: 25,
      }),
    queryKey: adminQueryKeys.securitySignals({
      noteId: null,
      severity: securitySeverity || null,
      take: 25,
    }),
    staleTime: 30_000,
  });

  const searchQuery = useAuthenticatedQuery({
    enabled: initialTab === "ops" && canReadSearch && searchValue.trim().length >= 2,
    queryFn: (accessToken) =>
      searchAdminWorkspace(accessToken, {
        limit: 20,
        q: searchValue.trim(),
      }),
    queryKey: adminQueryKeys.search({
      limit: 20,
      q: searchValue.trim() || null,
    }),
    staleTime: 15_000,
  });

  const selectedTemplate = useMemo(() => {
    const items = templatesQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }

    if (selectedTemplateId === NEW_TEMPLATE_DRAFT_ID) {
      return null;
    }

    return items.find((item) => item.id === selectedTemplateId) ?? items[0];
  }, [selectedTemplateId, templatesQuery.data?.items]);

  const selectedBroadcast = useMemo(() => {
    const items = broadcastsQuery.data?.items ?? [];
    if (!items.length) {
      return null;
    }

    if (selectedBroadcastId === NEW_BROADCAST_DRAFT_ID) {
      return null;
    }

    return items.find((item) => item.id === selectedBroadcastId) ?? items[0];
  }, [selectedBroadcastId, broadcastsQuery.data?.items]);

  const templateEditorKey = selectedTemplate?.id ?? NEW_TEMPLATE_DRAFT_ID;
  const templateForm =
    templateDrafts[templateEditorKey] ?? buildTemplateFormState(selectedTemplate);
  const broadcastEditorKey = selectedBroadcast?.id ?? NEW_BROADCAST_DRAFT_ID;
  const broadcastForm =
    broadcastDrafts[broadcastEditorKey] ?? buildBroadcastFormState(selectedBroadcast);

  function updateTemplateForm(
    updater: (current: NotificationTemplateFormState) => NotificationTemplateFormState,
  ) {
    setTemplateDrafts((current) => ({
      ...current,
      [templateEditorKey]: updater(
        current[templateEditorKey] ?? buildTemplateFormState(selectedTemplate),
      ),
    }));
  }

  function updateBroadcastForm(
    updater: (current: NotificationBroadcastFormState) => NotificationBroadcastFormState,
  ) {
    setBroadcastDrafts((current) => ({
      ...current,
      [broadcastEditorKey]: updater(
        current[broadcastEditorKey] ?? buildBroadcastFormState(selectedBroadcast),
      ),
    }));
  }

  const saveTemplateMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        bodyTemplate: templateForm.bodyTemplate.trim(),
        channel: templateForm.channel,
        key: templateForm.key.trim(),
        metaJson: templateForm.metaJson.trim()
          ? (JSON.parse(templateForm.metaJson) as Record<string, never>)
          : undefined,
        name: templateForm.name.trim(),
        status: templateForm.status,
        subjectTemplate: templateForm.subjectTemplate.trim() || undefined,
        titleTemplate: templateForm.titleTemplate.trim(),
      };

      if (!input.key || !input.name || !input.titleTemplate || !input.bodyTemplate) {
        throw new Error("Template key, name, title template, and body template are required.");
      }

      if (selectedTemplate) {
        return updateAdminNotificationTemplate(selectedTemplate.id, input, accessToken);
      }

      return createAdminNotificationTemplate(input, accessToken);
    },
    onSuccess: async (template) => {
      setSelectedTemplateId(template.id);
      setTemplateDrafts((current) => ({
        ...current,
        [template.id]: buildTemplateFormState(template),
      }));
      setMessage("Notification template saved.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notifications", "templates"],
      });
    },
  });

  const saveBroadcastMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        audienceType: broadcastForm.audienceType,
        body: broadcastForm.body.trim(),
        channel: broadcastForm.channel,
        filtersJson: broadcastForm.filtersJson.trim()
          ? (JSON.parse(broadcastForm.filtersJson) as Record<string, never>)
          : undefined,
        payloadJson: broadcastForm.payloadJson.trim()
          ? (JSON.parse(broadcastForm.payloadJson) as Record<string, never>)
          : undefined,
        scheduledAt: toIsoDateTime(broadcastForm.scheduledAt),
        templateId: broadcastForm.templateId.trim() || undefined,
        title: broadcastForm.title.trim(),
      };

      if (!input.title || !input.body) {
        throw new Error("Broadcast title and body are required.");
      }

      if (selectedBroadcast) {
        return updateAdminNotificationBroadcast(selectedBroadcast.id, input, accessToken);
      }

      return createAdminNotificationBroadcast(input, accessToken);
    },
    onSuccess: async (broadcast) => {
      setSelectedBroadcastId(broadcast.id);
      setBroadcastDrafts((current) => ({
        ...current,
        [broadcast.id]: buildBroadcastFormState(broadcast),
      }));
      setMessage("Broadcast saved.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notifications", "broadcasts"],
      });
    },
  });

  const broadcastActionMutation = useAuthenticatedMutation({
    mutationFn: async (action: "dispatch" | "cancel", accessToken) => {
      if (!selectedBroadcast) {
        throw new Error("Select a broadcast first.");
      }

      return action === "dispatch"
        ? dispatchAdminNotificationBroadcast(
            selectedBroadcast.id,
            accessToken,
            crypto.randomUUID(),
          )
        : cancelAdminNotificationBroadcast(selectedBroadcast.id, accessToken);
    },
    onSuccess: async () => {
      setMessage("Broadcast action completed.");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "notifications", "broadcasts"],
      });
    },
  });

  const revokeNoteViewSessionMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!manualNoteViewSessionId.trim()) {
        throw new Error("A note view session ID is required.");
      }

      return revokeAdminNoteViewSession(manualNoteViewSessionId.trim(), accessToken);
    },
    onSuccess: async () => {
      setMessage("Note view session revoked.");
      setManualNoteViewSessionId("");
    },
  });

  async function handleExport(path: string, filename: string) {
    const accessToken = await authSession.ensureAccessToken();

    if (!accessToken) {
      setExportMessage("An active admin session is required for exports.");
      return;
    }

    const response = await fetch(buildApiUrl(path), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      setExportMessage(`Export failed with status ${response.status}.`);
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setExportMessage(`Downloaded ${filename}.`);
  }

  const canReadCurrent =
    (initialTab === "notifications" && canReadNotifications) ||
    (initialTab === "analytics" && canReadAnalytics) ||
    (initialTab === "ops" && (canReadOps || canReadSearch || canReadSecurity));

  if (!canReadCurrent) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This intelligence workspace is locked."
        description="The current session does not expose the required notification, analytics, or ops read permission for this route."
      />
    );
  }

  if (
    (initialTab === "notifications" &&
      (templatesQuery.isLoading || broadcastsQuery.isLoading || messagesQuery.isLoading)) ||
    (initialTab === "analytics" && analyticsQuery.isLoading) ||
    (initialTab === "ops" &&
      (opsDashboardQuery.isLoading || contentHealthQuery.isLoading || securitySignalsQuery.isLoading))
  ) {
    return (
      <LoadingState
        title={`Loading ${initialTab} workspace`}
        description="Pulling notifications, analytics, search, and operational datasets from the backend admin APIs."
      />
    );
  }

  if (
    (initialTab === "notifications" &&
      (templatesQuery.error || broadcastsQuery.error || messagesQuery.error)) ||
    (initialTab === "analytics" && analyticsQuery.error) ||
    (initialTab === "ops" &&
      (opsDashboardQuery.error || contentHealthQuery.error || securitySignalsQuery.error || searchQuery.error))
  ) {
    return (
      <ErrorState
        title="The intelligence workspace could not be loaded."
        description="One or more notifications, analytics, or ops queries failed."
        onRetry={() => {
          if (initialTab === "notifications") {
            void templatesQuery.refetch();
            void broadcastsQuery.refetch();
            void messagesQuery.refetch();
            return;
          }

          if (initialTab === "analytics") {
            void analyticsQuery.refetch();
            return;
          }

          void opsDashboardQuery.refetch();
          void contentHealthQuery.refetch();
          void securitySignalsQuery.refetch();
          void searchQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Reach and intelligence"
        title={
          initialTab === "notifications"
            ? "Notifications"
            : initialTab === "analytics"
              ? "Analytics"
              : "Operations"
        }
        description={
          initialTab === "notifications"
            ? "Create templates, send broadcasts, and review delivery status."
            : initialTab === "analytics"
              ? "Review students, content, revenue, and activity reports."
              : "Use search, exports, content health, and security checks."
        }
      />

      <AdminRouteTabs
        activeHref={
          initialTab === "notifications"
            ? "/admin/notifications"
            : initialTab === "analytics"
              ? "/admin/analytics"
              : "/admin/ops"
        }
        items={[
          {
            href: "/admin/notifications",
            label: "Notifications",
            description: "Templates, broadcasts, dispatch, and delivery visibility.",
          },
          {
            href: "/admin/analytics",
            label: "Analytics",
            description: "Users, content, revenue, and activity rollups.",
          },
          {
            href: "/admin/ops",
            label: "Operations",
            description: "Search, exports, content health, and security signals.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={
          initialTab === "notifications"
            ? "Search notification templates by key or name"
            : initialTab === "ops"
              ? "Search admin workspace resources"
              : "Search is not used on analytics"
        }
        resultSummary={
          initialTab === "notifications"
            ? `${templatesQuery.data?.items.length ?? 0} templates, ${
                broadcastsQuery.data?.items.length ?? 0
              } broadcasts, and ${messagesQuery.data?.items.length ?? 0} messages visible.`
            : initialTab === "analytics"
              ? "Analytics overview reflects backend-generated aggregate metrics."
              : `${securitySignalsQuery.data?.items.length ?? 0} security signals visible.`
        }
      >
        {initialTab === "notifications" ? (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Template status</span>
              <select
                value={templateStatus}
                onChange={(event) =>
                  setTemplateStatus(
                    event.target.value as NotificationTemplateStatus | "",
                  )
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {TEMPLATE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Broadcast status</span>
              <select
                value={broadcastStatus}
                onChange={(event) =>
                  setBroadcastStatus(
                    event.target.value as NotificationBroadcastStatus | "",
                  )
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {BROADCAST_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Message status</span>
              <select
                value={messageStatus}
                onChange={(event) =>
                  setMessageStatus(event.target.value as NotificationMessageStatus | "")
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {MESSAGE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : initialTab === "ops" ? (
          <label className="tc-form-field min-w-[12rem]">
            <span className="tc-form-label">Signal severity</span>
            <select
              value={securitySeverity}
              onChange={(event) =>
                setSecuritySeverity(event.target.value as SecuritySignalSeverity | "")
              }
              className="tc-input"
            >
              <option value="">All severities</option>
              {SECURITY_SEVERITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {exportMessage ? <AdminInlineNotice>{exportMessage}</AdminInlineNotice> : null}
      {saveTemplateMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            saveTemplateMutation.error,
            "The notification template could not be saved.",
          )}
        </AdminInlineNotice>
      ) : null}
      {saveBroadcastMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            saveBroadcastMutation.error,
            "The notification broadcast could not be saved.",
          )}
        </AdminInlineNotice>
      ) : null}
      {broadcastActionMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            broadcastActionMutation.error,
            "The broadcast action could not be completed.",
          )}
        </AdminInlineNotice>
      ) : null}
      {revokeNoteViewSessionMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            revokeNoteViewSessionMutation.error,
            "The note view session could not be revoked.",
          )}
        </AdminInlineNotice>
      ) : null}

      {initialTab === "notifications" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)]">
          <section className="space-y-6">
            <AdminDataTable
              rows={templatesQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedTemplate?.id ?? null}
              onRowClick={(row) => setSelectedTemplateId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Templates"
                  title="No notification templates matched the current filters."
                  description="Create a template to seed system messaging flows."
                />
              }
              columns={[
                {
                  header: "Template",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.name}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.key} · {row.channel}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "ACTIVE" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                    />
                  ),
                },
              ]}
            />

            <AdminDataTable
              rows={broadcastsQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedBroadcast?.id ?? null}
              onRowClick={(row) => setSelectedBroadcastId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Broadcasts"
                  title="No broadcasts matched the current filters."
                  description="Create a broadcast when you need a targeted or mass send."
                />
              }
              columns={[
                {
                  header: "Broadcast",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.audienceType} · {row.channel}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "SENT" ? "live" : row.status === "FAILED" || row.status === "CANCELLED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Recipients",
                  render: (row) => (
                    <p className="text-sm text-[color:var(--muted)]">
                      {row.deliveredCount}/{row.recipientCount}
                    </p>
                  ),
                },
              ]}
            />

            <AdminDataTable
              rows={messagesQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              emptyState={
                <EmptyState
                  eyebrow="Messages"
                  title="No delivery messages matched the current filters."
                  description="This section fills as broadcasts and system notifications are created."
                />
              }
              columns={[
                {
                  header: "Message",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">{row.channel}</p>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "DELIVERED" || row.status === "READ" ? "live" : row.status === "FAILED" || row.status === "CANCELLED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Created",
                  render: (row) => row.createdAt,
                },
              ]}
            />
          </section>

          <section className="space-y-6">
            <section className="tc-card rounded-[28px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  Notification template
                </h2>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canManageNotifications}
                  onClick={() => {
                    setSelectedTemplateId(NEW_TEMPLATE_DRAFT_ID);
                    setTemplateDrafts((current) => ({
                      ...current,
                      [NEW_TEMPLATE_DRAFT_ID]: EMPTY_TEMPLATE_FORM_STATE,
                    }));
                  }}
                >
                  New template
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <AdminInput
                  label="Key"
                  value={templateForm.key}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      key: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Name"
                  value={templateForm.name}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminSelect
                    label="Channel"
                    value={templateForm.channel}
                    onChange={(event) =>
                      updateTemplateForm((current) => ({
                        ...current,
                        channel: event.target.value as NotificationChannel,
                      }))
                    }
                  >
                    {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminSelect
                    label="Status"
                    value={templateForm.status}
                    onChange={(event) =>
                      updateTemplateForm((current) => ({
                        ...current,
                        status: event.target.value as NotificationTemplateStatus,
                      }))
                    }
                  >
                    {TEMPLATE_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <AdminInput
                  label="Subject template"
                  value={templateForm.subjectTemplate}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      subjectTemplate: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Title template"
                  value={templateForm.titleTemplate}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      titleTemplate: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Body template"
                  value={templateForm.bodyTemplate}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      bodyTemplate: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Meta JSON"
                  value={templateForm.metaJson}
                  onChange={(event) =>
                    updateTemplateForm((current) => ({
                      ...current,
                      metaJson: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageNotifications || saveTemplateMutation.isPending}
                  onClick={() => saveTemplateMutation.mutate()}
                >
                  {saveTemplateMutation.isPending ? "Saving..." : "Save template"}
                </button>
              </div>
            </section>

            <section className="tc-card rounded-[28px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  Notification broadcast
                </h2>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canManageNotifications}
                  onClick={() => {
                    setSelectedBroadcastId(NEW_BROADCAST_DRAFT_ID);
                    setBroadcastDrafts((current) => ({
                      ...current,
                      [NEW_BROADCAST_DRAFT_ID]: EMPTY_BROADCAST_FORM_STATE,
                    }));
                  }}
                >
                  New broadcast
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <AdminSelect
                  label="Template"
                  value={broadcastForm.templateId}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      templateId: event.target.value,
                    }))
                  }
                >
                  <option value="">Custom broadcast</option>
                  {(templatesQuery.data?.items ?? []).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </AdminSelect>
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminSelect
                    label="Audience"
                    value={broadcastForm.audienceType}
                    onChange={(event) =>
                      updateBroadcastForm((current) => ({
                        ...current,
                        audienceType: event.target.value as NotificationBroadcastAudience,
                      }))
                    }
                  >
                    {BROADCAST_AUDIENCE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminSelect
                    label="Channel"
                    value={broadcastForm.channel}
                    onChange={(event) =>
                      updateBroadcastForm((current) => ({
                        ...current,
                        channel: event.target.value as NotificationChannel,
                      }))
                    }
                  >
                    {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <AdminInput
                  label="Title"
                  value={broadcastForm.title}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Body"
                  value={broadcastForm.body}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Scheduled at"
                  type="datetime-local"
                  value={broadcastForm.scheduledAt}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      scheduledAt: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Filters JSON"
                  value={broadcastForm.filtersJson}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      filtersJson: event.target.value,
                    }))
                  }
                />
                <AdminTextarea
                  label="Payload JSON"
                  value={broadcastForm.payloadJson}
                  onChange={(event) =>
                    updateBroadcastForm((current) => ({
                      ...current,
                      payloadJson: event.target.value,
                    }))
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="tc-button-primary"
                    disabled={!canManageNotifications || saveBroadcastMutation.isPending}
                    onClick={() => saveBroadcastMutation.mutate()}
                  >
                    {saveBroadcastMutation.isPending ? "Saving..." : "Save broadcast"}
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    disabled={!selectedBroadcast || !canSendNotifications || broadcastActionMutation.isPending}
                    onClick={() => broadcastActionMutation.mutate("dispatch")}
                  >
                    Dispatch
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    disabled={!selectedBroadcast || !canManageNotifications || broadcastActionMutation.isPending}
                    onClick={() => broadcastActionMutation.mutate("cancel")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          </section>
        </div>
      ) : initialTab === "analytics" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Students"
            value={analyticsQuery.data?.users.totalStudents ?? "—"}
            detail={`${analyticsQuery.data?.users.activeStudents ?? 0} active students`}
          />
          <AdminMetricCard
            label="Published notes"
            value={analyticsQuery.data?.content.publishedNotes ?? "—"}
            detail={`${analyticsQuery.data?.content.publishedQuestions ?? 0} questions and ${analyticsQuery.data?.content.publishedTests ?? 0} tests`}
          />
          <AdminMetricCard
            label="Revenue"
            value={analyticsQuery.data?.revenue.totalRevenuePaise ?? "—"}
            detail={`${analyticsQuery.data?.revenue.successfulOrders ?? 0} successful orders`}
          />
          <AdminMetricCard
            label="Activity"
            value={analyticsQuery.data?.activity.recentPracticeSessions ?? "—"}
            detail={`${analyticsQuery.data?.activity.sentBroadcasts ?? 0} recent broadcasts`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              label="Students"
              value={opsDashboardQuery.data?.users.students ?? "—"}
              detail={`${opsDashboardQuery.data?.users.admins ?? 0} admins`}
            />
            <AdminMetricCard
              label="Pending uploads"
              value={opsDashboardQuery.data?.operational.pendingUploads ?? "—"}
              detail={`${contentHealthQuery.data?.pendingFileUploads ?? 0} file uploads pending`}
            />
            <AdminMetricCard
              label="Content drafts"
              value={contentHealthQuery.data?.draftStructuredContent ?? "—"}
              detail={`${contentHealthQuery.data?.draftNotes ?? 0} notes and ${contentHealthQuery.data?.draftTests ?? 0} tests`}
            />
            <AdminMetricCard
              label="Security signals"
              value={opsDashboardQuery.data?.operational.recentSecuritySignals ?? "—"}
              detail={`${securitySignalsQuery.data?.items.length ?? 0} visible in this view`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)]">
            <section className="space-y-6">
              <AdminDataTable
                rows={securitySignalsQuery.data?.items ?? []}
                getRowId={(row) => row.id}
                emptyState={
                  <EmptyState
                    eyebrow="Security"
                    title="No note security signals matched the current filters."
                    description="This list will populate as backend security rules flag protected-reader anomalies."
                  />
                }
                columns={[
                  {
                    header: "Signal",
                    render: (row) => (
                      <div className="space-y-1">
                        <p className="font-semibold text-[color:var(--brand)]">{row.signalKey}</p>
                        <p className="text-xs text-[color:var(--muted)]">
                          {getOptionalText(row.noteTitle) ?? "Protected note"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    header: "Severity",
                    render: (row) => (
                      <AdminToneBadge
                        label={row.severity}
                        tone={row.severity === "HIGH" ? "danger" : row.severity === "MEDIUM" ? "warning" : "info"}
                      />
                    ),
                  },
                  {
                    header: "User",
                    render: (row) => getOptionalText(row.userEmail) ?? "Unknown user",
                  },
                  {
                    header: "Created",
                    render: (row) => row.createdAt,
                  },
                ]}
              />

              {searchQuery.data?.groups?.length ? (
                <section className="tc-card rounded-[28px] p-6">
                  <h2 className="tc-display text-2xl font-semibold tracking-tight">
                    Admin search
                  </h2>
                  <div className="mt-4 grid gap-4">
                    {searchQuery.data.groups.map((group) => (
                      <div key={group.resourceType} className="space-y-2">
                        <p className="font-semibold text-[color:var(--brand)]">
                          {group.resourceType}
                        </p>
                        <div className="grid gap-2">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/80 px-4 py-3 text-sm"
                            >
                              <p className="font-semibold text-[color:var(--brand)]">
                                {getOptionalText(item.title) ?? item.id}
                              </p>
                              <p className="text-xs text-[color:var(--muted)]">
                                {item.resourceType} · {item.id}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>

            <section className="space-y-6">
              <section className="tc-card rounded-[28px] p-6">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  Export tools
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="tc-button-primary"
                    disabled={!canExportOps}
                    onClick={() => void handleExport(apiRoutes.admin.ops.exportUsers, "users.csv")}
                  >
                    Export users
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    disabled={!canExportOps}
                    onClick={() =>
                      void handleExport(
                        apiRoutes.admin.ops.exportSubscriptions,
                        "subscriptions.csv",
                      )
                    }
                  >
                    Export subscriptions
                  </button>
                  <button
                    type="button"
                    className="tc-button-secondary"
                    disabled={!canExportOps}
                    onClick={() =>
                      void handleExport(apiRoutes.admin.ops.exportPayments, "payments.csv")
                    }
                  >
                    Export payments
                  </button>
                </div>
              </section>

              <section className="tc-card rounded-[28px] p-6">
                <h2 className="tc-display text-2xl font-semibold tracking-tight">
                  Manual note session revoke
                </h2>
                <div className="mt-4 grid gap-4">
                  <AdminInput
                    label="Note view session ID"
                    value={manualNoteViewSessionId}
                    onChange={(event) => setManualNoteViewSessionId(event.target.value)}
                  />
                  <button
                    type="button"
                    className="tc-button-primary"
                    disabled={!canSupportOps || revokeNoteViewSessionMutation.isPending}
                    onClick={() => revokeNoteViewSessionMutation.mutate()}
                  >
                    {revokeNoteViewSessionMutation.isPending
                      ? "Revoking..."
                      : "Revoke note view session"}
                  </button>
                </div>
              </section>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
