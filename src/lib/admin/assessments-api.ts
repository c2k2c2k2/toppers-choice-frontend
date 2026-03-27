import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminQuestionListQuery,
  AdminTestListQuery,
  CreateQuestionInput,
  CreateTestInput,
  QuestionDetail,
  QuestionsListResponse,
  TestDetail,
  TestsListResponse,
  UpdateQuestionInput,
  UpdateTestInput,
} from "@/lib/admin/types";

export async function listAdminQuestions(
  accessToken: string,
  query: AdminQuestionListQuery = {},
) {
  return apiRequest<QuestionsListResponse>(
    withQuery(apiRoutes.admin.questions.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminQuestion(
  questionId: string,
  accessToken: string,
) {
  return apiRequest<QuestionDetail>(apiRoutes.admin.questions.detail(questionId), {
    accessToken,
  });
}

export async function createAdminQuestion(
  input: CreateQuestionInput,
  accessToken: string,
) {
  return apiRequest<QuestionDetail>(apiRoutes.admin.questions.list, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminQuestion(
  questionId: string,
  input: UpdateQuestionInput,
  accessToken: string,
) {
  return apiRequest<QuestionDetail>(apiRoutes.admin.questions.detail(questionId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminQuestion(
  questionId: string,
  accessToken: string,
) {
  return apiRequest<QuestionDetail>(apiRoutes.admin.questions.publish(questionId), {
    method: "POST",
    accessToken,
  });
}

export async function unpublishAdminQuestion(
  questionId: string,
  accessToken: string,
) {
  return apiRequest<QuestionDetail>(apiRoutes.admin.questions.unpublish(questionId), {
    method: "POST",
    accessToken,
  });
}

export async function listAdminTests(
  accessToken: string,
  query: AdminTestListQuery = {},
) {
  return apiRequest<TestsListResponse>(
    withQuery(apiRoutes.admin.tests.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminTest(testId: string, accessToken: string) {
  return apiRequest<TestDetail>(apiRoutes.admin.tests.detail(testId), {
    accessToken,
  });
}

export async function createAdminTest(
  input: CreateTestInput,
  accessToken: string,
) {
  return apiRequest<TestDetail>(apiRoutes.admin.tests.list, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminTest(
  testId: string,
  input: UpdateTestInput,
  accessToken: string,
) {
  return apiRequest<TestDetail>(apiRoutes.admin.tests.detail(testId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminTest(testId: string, accessToken: string) {
  return apiRequest<TestDetail>(apiRoutes.admin.tests.publish(testId), {
    method: "POST",
    accessToken,
  });
}

export async function unpublishAdminTest(testId: string, accessToken: string) {
  return apiRequest<TestDetail>(apiRoutes.admin.tests.unpublish(testId), {
    method: "POST",
    accessToken,
  });
}
