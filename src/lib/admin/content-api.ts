import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminContentListQuery,
  ContentDetail,
  ContentListResponse,
  CreateContentInput,
  FeatureContentInput,
  PublishContentInput,
  ReorderContentInput,
  UpdateContentInput,
} from "@/lib/admin/types";

export async function listAdminContent(
  accessToken: string,
  query: AdminContentListQuery = {},
) {
  return apiRequest<ContentListResponse>(
    withQuery(apiRoutes.admin.content.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminContent(
  contentEntryId: string,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.detail(contentEntryId), {
    accessToken,
  });
}

export async function createAdminContent(
  input: CreateContentInput,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.list, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminContent(
  contentEntryId: string,
  input: UpdateContentInput,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.detail(contentEntryId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminContent(
  contentEntryId: string,
  accessToken: string,
  input: PublishContentInput = {},
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.publish(contentEntryId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function unpublishAdminContent(
  contentEntryId: string,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.unpublish(contentEntryId), {
    method: "POST",
    accessToken,
  });
}

export async function featureAdminContent(
  contentEntryId: string,
  input: FeatureContentInput,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.feature(contentEntryId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function unfeatureAdminContent(
  contentEntryId: string,
  accessToken: string,
) {
  return apiRequest<ContentDetail>(apiRoutes.admin.content.unfeature(contentEntryId), {
    method: "POST",
    accessToken,
  });
}

export async function reorderAdminContent(
  input: ReorderContentInput,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(apiRoutes.admin.content.reorder, {
    method: "PUT",
    accessToken,
    body: input,
  });
}
