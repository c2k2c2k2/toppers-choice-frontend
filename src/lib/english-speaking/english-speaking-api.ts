import { apiRequest } from "@/lib/api/client";
import { buildApiUrl } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  StudentEnglishSpeakingTopicDetail,
  StudentEnglishSpeakingTopicListResponse,
} from "@/lib/english-speaking/types";

export async function listStudentEnglishSpeakingTopics(accessToken: string) {
  return apiRequest<StudentEnglishSpeakingTopicListResponse>(
    apiRoutes.englishSpeaking.list,
    {
      accessToken,
    },
  );
}

export async function getStudentEnglishSpeakingTopic(
  slug: string,
  accessToken: string,
) {
  return apiRequest<StudentEnglishSpeakingTopicDetail>(
    apiRoutes.englishSpeaking.detail(slug),
    {
      accessToken,
    },
  );
}

export async function fetchEnglishSpeakingAudioBlob(
  path: string,
  accessToken: string,
) {
  const response = await fetch(buildApiUrl(path), {
    cache: "no-store",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("The requested audio could not be loaded.");
  }

  return response.blob();
}
