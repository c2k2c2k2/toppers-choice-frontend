import { apiRequest, type ApiRequestOptions } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  SaveTestAttemptAnswerInput,
  SaveTestAttemptAnswerResponse,
  StudentTestDetail,
  TestAttemptDetail,
  TestAttemptsFilters,
  TestAttemptsListResponse,
  TestsListFilters,
  TestsListResponse,
} from "@/lib/tests/types";

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

export function listPublishedTests(
  accessToken: string,
  filters: TestsListFilters = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<TestsListResponse>(
    withQuery(apiRoutes.tests.list, {
      accessType: filters.accessType ?? null,
      examTrackId: filters.examTrackId ?? null,
      family: filters.family ?? null,
      mediumId: filters.mediumId ?? null,
      subjectId: filters.subjectId ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function getPublishedTest(
  testId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<StudentTestDetail>(
    apiRoutes.tests.detail(testId),
    buildAuthedOptions(accessToken, options),
  );
}

export function startTestAttempt(
  testId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<TestAttemptDetail>(apiRoutes.tests.startAttempt(testId), {
    ...buildAuthedOptions(accessToken, options),
    method: "POST",
  });
}

export function listTestAttempts(
  accessToken: string,
  filters: TestAttemptsFilters = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<TestAttemptsListResponse>(
    withQuery(apiRoutes.tests.attemptHistory, {
      limit: filters.limit ?? null,
      status: filters.status ?? null,
      testId: filters.testId ?? null,
    }),
    buildAuthedOptions(accessToken, options),
  );
}

export function getTestAttempt(
  attemptId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<TestAttemptDetail>(
    apiRoutes.tests.attempt(attemptId),
    buildAuthedOptions(accessToken, options),
  );
}

export function saveTestAttemptAnswer(
  attemptId: string,
  input: SaveTestAttemptAnswerInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<SaveTestAttemptAnswerResponse>(apiRoutes.tests.save(attemptId), {
    ...buildAuthedOptions(accessToken, options),
    body: input,
    method: "POST",
  });
}

export function submitTestAttempt(
  attemptId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<TestAttemptDetail>(apiRoutes.tests.submit(attemptId), {
    ...buildAuthedOptions(accessToken, options),
    method: "POST",
  });
}
