import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type { components } from "@/lib/api/generated/backend-schema";
import type {
  AdminSubjectListQuery,
  AdminTopicListQuery,
  CreateExamTrackInput,
  CreateMediumInput,
  CreateSubjectInput,
  CreateTagInput,
  CreateTopicInput,
  ExamTrack,
  Medium,
  ReorderTaxonomyInput,
  Subject,
  Tag,
  Topic,
  UpdateExamTrackInput,
  UpdateMediumInput,
  UpdateSubjectInput,
  UpdateTagInput,
  UpdateTopicInput,
} from "@/lib/admin/types";

type ActionMessage = components["schemas"]["ActionMessageResponseDto"];

export async function listAdminExamTracks(accessToken: string) {
  return apiRequest<ExamTrack[]>(apiRoutes.admin.taxonomy.examTracks, {
    accessToken,
  });
}

export async function createAdminExamTrack(
  input: CreateExamTrackInput,
  accessToken: string,
) {
  return apiRequest<ExamTrack>(apiRoutes.admin.taxonomy.examTracks, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminExamTrack(
  examTrackId: string,
  input: UpdateExamTrackInput,
  accessToken: string,
) {
  return apiRequest<ExamTrack>(apiRoutes.admin.taxonomy.examTrack(examTrackId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function reorderAdminExamTracks(
  input: ReorderTaxonomyInput,
  accessToken: string,
) {
  return apiRequest<ActionMessage>(apiRoutes.admin.taxonomy.reorderExamTracks, {
    method: "PUT",
    accessToken,
    body: input,
  });
}

export async function listAdminMediums(accessToken: string) {
  return apiRequest<Medium[]>(apiRoutes.admin.taxonomy.mediums, {
    accessToken,
  });
}

export async function createAdminMedium(
  input: CreateMediumInput,
  accessToken: string,
) {
  return apiRequest<Medium>(apiRoutes.admin.taxonomy.mediums, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminMedium(
  mediumId: string,
  input: UpdateMediumInput,
  accessToken: string,
) {
  return apiRequest<Medium>(apiRoutes.admin.taxonomy.medium(mediumId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function reorderAdminMediums(
  input: ReorderTaxonomyInput,
  accessToken: string,
) {
  return apiRequest<ActionMessage>(apiRoutes.admin.taxonomy.reorderMediums, {
    method: "PUT",
    accessToken,
    body: input,
  });
}

export async function listAdminSubjects(
  accessToken: string,
  query: AdminSubjectListQuery = {},
) {
  return apiRequest<Subject[]>(
    withQuery(apiRoutes.admin.taxonomy.subjects, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function createAdminSubject(
  input: CreateSubjectInput,
  accessToken: string,
) {
  return apiRequest<Subject>(apiRoutes.admin.taxonomy.subjects, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminSubject(
  subjectId: string,
  input: UpdateSubjectInput,
  accessToken: string,
) {
  return apiRequest<Subject>(apiRoutes.admin.taxonomy.subject(subjectId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function reorderAdminSubjects(
  input: ReorderTaxonomyInput,
  accessToken: string,
) {
  return apiRequest<ActionMessage>(apiRoutes.admin.taxonomy.reorderSubjects, {
    method: "PUT",
    accessToken,
    body: input,
  });
}

export async function listAdminTopics(
  accessToken: string,
  query: AdminTopicListQuery = {},
) {
  return apiRequest<Topic[]>(
    withQuery(apiRoutes.admin.taxonomy.topics, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function createAdminTopic(
  input: CreateTopicInput,
  accessToken: string,
) {
  return apiRequest<Topic>(apiRoutes.admin.taxonomy.topics, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminTopic(
  topicId: string,
  input: UpdateTopicInput,
  accessToken: string,
) {
  return apiRequest<Topic>(apiRoutes.admin.taxonomy.topic(topicId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function reorderAdminTopics(
  input: ReorderTaxonomyInput,
  accessToken: string,
) {
  return apiRequest<ActionMessage>(apiRoutes.admin.taxonomy.reorderTopics, {
    method: "PUT",
    accessToken,
    body: input,
  });
}

export async function listAdminTags(accessToken: string) {
  return apiRequest<Tag[]>(apiRoutes.admin.taxonomy.tags, {
    accessToken,
  });
}

export async function createAdminTag(
  input: CreateTagInput,
  accessToken: string,
) {
  return apiRequest<Tag>(apiRoutes.admin.taxonomy.tags, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminTag(
  tagId: string,
  input: UpdateTagInput,
  accessToken: string,
) {
  return apiRequest<Tag>(apiRoutes.admin.taxonomy.tag(tagId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function reorderAdminTags(
  input: ReorderTaxonomyInput,
  accessToken: string,
) {
  return apiRequest<ActionMessage>(apiRoutes.admin.taxonomy.reorderTags, {
    method: "PUT",
    accessToken,
    body: input,
  });
}
