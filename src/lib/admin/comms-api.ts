import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminNotificationBroadcastListQuery,
  AdminNotificationMessageListQuery,
  AdminNotificationTemplateListQuery,
  CreateNotificationBroadcastInput,
  CreateNotificationTemplateInput,
  NotificationBroadcast,
  NotificationBroadcastsListResponse,
  NotificationMessagesListResponse,
  NotificationTemplate,
  NotificationTemplatesListResponse,
  UpdateNotificationBroadcastInput,
  UpdateNotificationTemplateInput,
} from "@/lib/admin/types";

export async function listAdminNotificationTemplates(
  accessToken: string,
  query: AdminNotificationTemplateListQuery = {},
) {
  return apiRequest<NotificationTemplatesListResponse>(
    withQuery(apiRoutes.admin.notifications.templates, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function createAdminNotificationTemplate(
  input: CreateNotificationTemplateInput,
  accessToken: string,
) {
  return apiRequest<NotificationTemplate>(apiRoutes.admin.notifications.templates, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminNotificationTemplate(
  templateId: string,
  input: UpdateNotificationTemplateInput,
  accessToken: string,
) {
  return apiRequest<NotificationTemplate>(apiRoutes.admin.notifications.template(templateId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function listAdminNotificationBroadcasts(
  accessToken: string,
  query: AdminNotificationBroadcastListQuery = {},
) {
  return apiRequest<NotificationBroadcastsListResponse>(
    withQuery(apiRoutes.admin.notifications.broadcasts, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminNotificationBroadcast(
  broadcastId: string,
  accessToken: string,
) {
  return apiRequest<NotificationBroadcast>(apiRoutes.admin.notifications.broadcast(broadcastId), {
    accessToken,
  });
}

export async function createAdminNotificationBroadcast(
  input: CreateNotificationBroadcastInput,
  accessToken: string,
) {
  return apiRequest<NotificationBroadcast>(apiRoutes.admin.notifications.broadcasts, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminNotificationBroadcast(
  broadcastId: string,
  input: UpdateNotificationBroadcastInput,
  accessToken: string,
) {
  return apiRequest<NotificationBroadcast>(apiRoutes.admin.notifications.broadcast(broadcastId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function dispatchAdminNotificationBroadcast(
  broadcastId: string,
  accessToken: string,
  idempotencyKey?: string,
) {
  return apiRequest<NotificationBroadcast>(apiRoutes.admin.notifications.dispatch(broadcastId), {
    method: "POST",
    accessToken,
    headers: idempotencyKey
      ? {
          "x-idempotency-key": idempotencyKey,
        }
      : undefined,
  });
}

export async function cancelAdminNotificationBroadcast(
  broadcastId: string,
  accessToken: string,
) {
  return apiRequest<NotificationBroadcast>(apiRoutes.admin.notifications.cancel(broadcastId), {
    method: "POST",
    accessToken,
  });
}

export async function listAdminNotificationMessages(
  accessToken: string,
  query: AdminNotificationMessageListQuery = {},
) {
  return apiRequest<NotificationMessagesListResponse>(
    withQuery(apiRoutes.admin.notifications.messages, query ?? {}),
    {
      accessToken,
    },
  );
}
