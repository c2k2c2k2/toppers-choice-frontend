import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminEnglishSpeakingTopicDetail,
  AdminEnglishSpeakingTopicListResponse,
  CreateEnglishSpeakingTopicInput,
  FinalizeEnglishSpeakingAudioInput,
  GenerateEnglishSpeakingAudioInput,
  UpdateEnglishSpeakingTopicInput,
} from "@/lib/english-speaking";

export interface AdminEnglishSpeakingListQuery {
  accessType?: string | null;
  search?: string | null;
  status?: string | null;
  visibility?: string | null;
}

export async function listAdminEnglishSpeakingTopics(
  accessToken: string,
  query: AdminEnglishSpeakingListQuery = {},
) {
  return apiRequest<AdminEnglishSpeakingTopicListResponse>(
    withQuery(
      apiRoutes.admin.englishSpeaking.list,
      query as Record<string, string | null | undefined>,
    ),
    {
      accessToken,
    },
  );
}

export async function getAdminEnglishSpeakingTopic(
  topicId: string,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.detail(topicId),
    {
      accessToken,
    },
  );
}

export async function deleteAdminEnglishSpeakingTopic(
  topicId: string,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    apiRoutes.admin.englishSpeaking.remove(topicId),
    {
      accessToken,
      method: "DELETE",
    },
  );
}

export async function createAdminEnglishSpeakingTopic(
  input: CreateEnglishSpeakingTopicInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.list,
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}

export async function updateAdminEnglishSpeakingTopic(
  topicId: string,
  input: UpdateEnglishSpeakingTopicInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.detail(topicId),
    {
      accessToken,
      body: input,
      method: "PATCH",
    },
  );
}

export async function publishAdminEnglishSpeakingTopic(
  topicId: string,
  accessToken: string,
  input: {
    publishAt?: string;
  } = {},
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.publish(topicId),
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}

export async function unpublishAdminEnglishSpeakingTopic(
  topicId: string,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.unpublish(topicId),
    {
      accessToken,
      method: "POST",
    },
  );
}

export async function generateAdminEnglishSpeakingSentenceAudio(
  sentenceId: string,
  input: GenerateEnglishSpeakingAudioInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.generateAudio(sentenceId),
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}

export async function generateAdminEnglishSpeakingTopicAudio(
  topicId: string,
  input: GenerateEnglishSpeakingAudioInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.generateTopicAudio(topicId),
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}

export async function finalizeAdminEnglishSpeakingSentenceAudio(
  sentenceId: string,
  input: FinalizeEnglishSpeakingAudioInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.finalizeAudio(sentenceId),
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}

export async function finalizeAdminEnglishSpeakingTopicAudio(
  topicId: string,
  input: FinalizeEnglishSpeakingAudioInput,
  accessToken: string,
) {
  return apiRequest<AdminEnglishSpeakingTopicDetail>(
    apiRoutes.admin.englishSpeaking.finalizeTopicAudio(topicId),
    {
      accessToken,
      body: input,
      method: "POST",
    },
  );
}
