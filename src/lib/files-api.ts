import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import { createApiError } from "@/lib/api/errors";

export type SelfServiceFilePurpose = "PROFILE_IMAGE" | "FEEDBACK_ATTACHMENT";

export interface FileAsset {
  id: string;
  purpose: SelfServiceFilePurpose;
  status: string;
  originalFileName: string;
  contentType: string;
}

interface InitUploadResponse {
  fileAsset: FileAsset;
  uploadUrl: string;
  uploadMethod: "PUT";
  requiredHeaders: Record<string, string>;
}

export async function uploadSelfServiceFile(
  input: {
    accessToken: string;
    file: File;
    purpose: SelfServiceFilePurpose;
  },
) {
  const initResponse = await apiRequest<InitUploadResponse>(
    apiRoutes.files.initUpload,
    {
      method: "POST",
      accessToken: input.accessToken,
      body: {
        contentType: input.file.type || "application/octet-stream",
        fileName: input.file.name,
        purpose: input.purpose,
        sizeBytes: input.file.size,
      },
    },
  );

  const uploadResponse = await fetch(initResponse.uploadUrl, {
    method: initResponse.uploadMethod,
    headers: initResponse.requiredHeaders,
    body: input.file,
  });

  if (!uploadResponse.ok) {
    throw await createApiError(uploadResponse, initResponse.uploadUrl);
  }

  return apiRequest<FileAsset>(
    apiRoutes.files.confirmUpload(initResponse.fileAsset.id),
    {
      method: "POST",
      accessToken: input.accessToken,
    },
  );
}
