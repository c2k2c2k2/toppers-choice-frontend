import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { UserIdentity } from "@/lib/auth/types";

export interface UpdateProfilePayload {
  email?: string;
  fullName: string;
  phone?: string;
  profileImageFileAssetId?: string | null;
}

export function getMyProfile(accessToken: string) {
  return apiRequest<UserIdentity>(apiRoutes.profile.me, {
    accessToken,
    cache: "no-store",
  });
}

export function updateMyProfile(
  payload: UpdateProfilePayload,
  accessToken: string,
) {
  return apiRequest<UserIdentity>(apiRoutes.profile.me, {
    method: "PATCH",
    accessToken,
    body: payload,
  });
}
