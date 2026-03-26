import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import { withQuery } from "@/lib/api/config";
import { createApiError } from "@/lib/api/errors";
import type {
  AdminFileListQuery,
  FileAsset,
  FileAssetListResponse,
  InitFileUploadInput,
  InitFileUploadResponse,
} from "@/lib/admin/types";

export async function listAdminAssets(
  accessToken: string,
  query: AdminFileListQuery = {},
) {
  return apiRequest<FileAssetListResponse>(
    withQuery(apiRoutes.admin.files.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminAsset(assetId: string, accessToken: string) {
  return apiRequest<FileAsset>(apiRoutes.admin.files.detail(assetId), {
    accessToken,
  });
}

export async function initAdminFileUpload(
  input: InitFileUploadInput,
  accessToken: string,
) {
  return apiRequest<InitFileUploadResponse>(apiRoutes.admin.files.initUpload, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function confirmAdminFileUpload(
  assetId: string,
  accessToken: string,
) {
  return apiRequest<FileAsset>(apiRoutes.admin.files.confirmUpload(assetId), {
    method: "POST",
    accessToken,
  });
}

export async function uploadAdminFile(
  input: {
    accessLevel?: InitFileUploadInput["accessLevel"];
    file: File;
    purpose: InitFileUploadInput["purpose"];
  },
  accessToken: string,
) {
  const initResponse = await initAdminFileUpload(
    {
      accessLevel: input.accessLevel,
      contentType: input.file.type || "application/octet-stream",
      fileName: input.file.name,
      purpose: input.purpose,
      sizeBytes: input.file.size,
    },
    accessToken,
  );

  const uploadHeaders = new Headers(initResponse.requiredHeaders);

  if (!uploadHeaders.has("content-type") && input.file.type) {
    uploadHeaders.set("content-type", input.file.type);
  }

  const uploadResponse = await fetch(initResponse.uploadUrl, {
    method: initResponse.uploadMethod,
    headers: uploadHeaders,
    body: input.file,
  });

  if (!uploadResponse.ok) {
    throw await createApiError(uploadResponse, initResponse.uploadUrl);
  }

  return confirmAdminFileUpload(initResponse.fileAsset.id, accessToken);
}
