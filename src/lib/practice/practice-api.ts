import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  EndPracticeSessionInput,
  PracticeAnswerMutationInput,
  PracticeAnswerResultResponse,
  PracticeQuestionBatchFilter,
  PracticeQuestionBatchResponse,
  PracticeRevealResultResponse,
  PracticeSaveResultResponse,
  PracticeSessionDetail,
  PracticeSessionsFilter,
  PracticeSessionsListResponse,
  PracticeSessionSummary,
  PracticeSubjectProgressFilter,
  PracticeSubjectProgressResponse,
  PracticeTopicProgressFilter,
  PracticeTopicProgressResponse,
  PracticeTrendsFilter,
  PracticeTrendsResponse,
  PracticeWeakQuestionsFilter,
  PracticeWeakQuestionsResponse,
  RevealPracticeQuestionInput,
  StartPracticeSessionInput,
  SubmitPracticeAnswerInput,
} from "@/lib/practice/types";

function buildAuthedOptions(
  accessToken: string,
  options: ApiRequestOptions = {},
): ApiRequestOptions {
  return {
    ...options,
    accessToken,
    cache: options.cache ?? "no-store",
  };
}

export function listPracticeSessions(
  accessToken: string,
  filters: PracticeSessionsFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSessionsListResponse>(
    withQuery(apiRoutes.practice.sessions, {
      limit: filters.limit ?? null,
      status: filters.status ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function startPracticeSession(
  input: StartPracticeSessionInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSessionSummary>(apiRoutes.practice.sessions, {
    ...buildAuthedOptions(accessToken, options),
    body: input,
    method: "POST",
  });
}

export function getPracticeSession(
  sessionId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSessionDetail>(
    apiRoutes.practice.session(sessionId),
    buildAuthedOptions(accessToken, options),
  );
}

export function getNextPracticeQuestions(
  sessionId: string,
  accessToken: string,
  filters: PracticeQuestionBatchFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeQuestionBatchResponse>(
    withQuery(apiRoutes.practice.next(sessionId), {
      batchSize: filters.batchSize ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function savePracticeAnswer(
  sessionId: string,
  input: PracticeAnswerMutationInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSaveResultResponse>(apiRoutes.practice.save(sessionId), {
    ...buildAuthedOptions(accessToken, options),
    body: input,
    method: "POST",
  });
}

export function submitPracticeAnswer(
  sessionId: string,
  input: SubmitPracticeAnswerInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeAnswerResultResponse>(apiRoutes.practice.answer(sessionId), {
    ...buildAuthedOptions(accessToken, options),
    body: input,
    method: "POST",
  });
}

export function revealPracticeAnswer(
  sessionId: string,
  input: RevealPracticeQuestionInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeRevealResultResponse>(
    apiRoutes.practice.reveal(sessionId),
    {
      ...buildAuthedOptions(accessToken, options),
      body: input,
      method: "POST",
    },
  );
}

export function endPracticeSession(
  sessionId: string,
  accessToken: string,
  input: EndPracticeSessionInput = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSessionSummary>(apiRoutes.practice.end(sessionId), {
    ...buildAuthedOptions(accessToken, options),
    body: input,
    method: "POST",
  });
}

export function listPracticeSubjectProgress(
  accessToken: string,
  filters: PracticeSubjectProgressFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeSubjectProgressResponse>(
    withQuery(apiRoutes.practice.progress.subjects, {
      examTrackId: filters.examTrackId ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function listPracticeTopicProgress(
  accessToken: string,
  filters: PracticeTopicProgressFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeTopicProgressResponse>(
    withQuery(apiRoutes.practice.progress.topics, {
      examTrackId: filters.examTrackId ?? null,
      subjectId: filters.subjectId ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function listWeakPracticeQuestions(
  accessToken: string,
  filters: PracticeWeakQuestionsFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeWeakQuestionsResponse>(
    withQuery(apiRoutes.practice.progress.weakQuestions, {
      limit: filters.limit ?? null,
      subjectId: filters.subjectId ?? null,
      topicId: filters.topicId ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function getPracticeTrends(
  accessToken: string,
  filters: PracticeTrendsFilter = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PracticeTrendsResponse>(
    withQuery(apiRoutes.practice.progress.trends, {
      days: filters.days ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}
