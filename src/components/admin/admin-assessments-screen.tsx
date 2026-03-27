"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminQuestion,
  createAdminTest,
  formatAdminDateTime,
  getAdminQuestion,
  getAdminTest,
  getApiErrorMessage,
  listAdminQuestions,
  listAdminTests,
  parseOptionalInteger,
  publishAdminQuestion,
  publishAdminTest,
  safeJsonParse,
  safeJsonParseArray,
  stringifyJsonInput,
  unpublishAdminQuestion,
  unpublishAdminTest,
  updateAdminQuestion,
  updateAdminTest,
  type QuestionDifficulty,
  type QuestionStatus,
  type QuestionType,
  type TestAccessType,
  type TestFamily,
  type TestStatus,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminToneBadge } from "@/components/admin/admin-status-badge";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type AssessmentTab = "questions" | "tests";

interface QuestionFormState {
  code: string;
  correctAnswerJson: string;
  difficulty: QuestionDifficulty;
  explanationJson: string;
  mediumId: string;
  metadataJson: string;
  optionsJson: string;
  statementJson: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
  mediaReferencesJson: string;
}

interface TestFormState {
  accessType: TestAccessType;
  availableFrom: string;
  availableUntil: string;
  code: string;
  configJson: string;
  durationMinutes: string;
  examTrackId: string;
  family: TestFamily;
  instructionsJson: string;
  maxAttempts: string;
  mediumId: string;
  questionsJson: string;
  randomizeQuestionOrder: boolean;
  shortDescription: string;
  slug: string;
  subjectId: string;
  title: string;
}

const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TEXT_INPUT",
];
const QUESTION_DIFFICULTY_OPTIONS: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const QUESTION_STATUS_OPTIONS: QuestionStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const TEST_STATUS_OPTIONS: TestStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const TEST_FAMILY_OPTIONS: TestFamily[] = ["SUBJECT_WISE", "MIXED", "EXAM_STYLE"];
const TEST_ACCESS_OPTIONS: TestAccessType[] = ["FREE", "PREMIUM"];

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

const EMPTY_QUESTION_FORM_STATE: QuestionFormState = {
  code: "",
  correctAnswerJson: "",
  difficulty: "MEDIUM",
  explanationJson: "",
  mediumId: "",
  metadataJson: "",
  optionsJson: "",
  statementJson: "",
  subjectId: "",
  topicId: "",
  type: "SINGLE_CHOICE",
  mediaReferencesJson: "",
};

const EMPTY_TEST_FORM_STATE: TestFormState = {
  accessType: "FREE",
  availableFrom: "",
  availableUntil: "",
  code: "",
  configJson: "",
  durationMinutes: "",
  examTrackId: "",
  family: "SUBJECT_WISE",
  instructionsJson: "",
  maxAttempts: "",
  mediumId: "",
  questionsJson: "",
  randomizeQuestionOrder: false,
  shortDescription: "",
  slug: "",
  subjectId: "",
  title: "",
};

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function buildQuestionFormState(
  question: Awaited<ReturnType<typeof getAdminQuestion>> | null,
): QuestionFormState {
  if (!question) {
    return EMPTY_QUESTION_FORM_STATE;
  }

  return {
    code: typeof question.code === "string" ? question.code : "",
    correctAnswerJson: stringifyJsonInput(question.correctAnswerJson),
    difficulty: question.difficulty,
    explanationJson: stringifyJsonInput(question.explanationJson),
    mediumId: typeof question.mediumId === "string" ? question.mediumId : "",
    metadataJson: stringifyJsonInput(question.metadataJson),
    optionsJson: stringifyJsonInput(
      question.options.map((option) => ({
        optionKey: option.optionKey,
        contentJson: option.contentJson,
        metaJson: option.metaJson,
        orderIndex: option.orderIndex,
      })),
    ),
    statementJson: stringifyJsonInput(question.statementJson),
    subjectId: question.subjectId,
    topicId: typeof question.topicId === "string" ? question.topicId : "",
    type: question.type,
    mediaReferencesJson: stringifyJsonInput(
      question.mediaReferences.map((reference) => ({
        fileAssetId: reference.fileAssetId,
        usage: reference.usage,
        optionKey: reference.optionKey,
        localeCode: reference.localeCode,
        orderIndex: reference.orderIndex,
      })),
    ),
  };
}

function buildTestFormState(
  test: Awaited<ReturnType<typeof getAdminTest>> | null,
): TestFormState {
  if (!test) {
    return EMPTY_TEST_FORM_STATE;
  }

  return {
    accessType: test.accessType,
    availableFrom: toDatetimeLocalValue(
      typeof test.availableFrom === "string" ? test.availableFrom : null,
    ),
    availableUntil: toDatetimeLocalValue(
      typeof test.availableUntil === "string" ? test.availableUntil : null,
    ),
    code: typeof test.code === "string" ? test.code : "",
    configJson: stringifyJsonInput(test.configJson),
    durationMinutes: String(test.durationMinutes),
    examTrackId: typeof test.examTrackId === "string" ? test.examTrackId : "",
    family: test.family,
    instructionsJson: stringifyJsonInput(test.instructionsJson),
    maxAttempts: String(test.maxAttempts),
    mediumId: typeof test.mediumId === "string" ? test.mediumId : "",
    questionsJson: stringifyJsonInput(
      test.questions.map((question) => ({
        negativeMarks: question.negativeMarks,
        orderIndex: question.orderIndex,
        positiveMarks: question.positiveMarks,
        questionId: question.questionId,
      })),
    ),
    randomizeQuestionOrder: test.randomizeQuestionOrder,
    shortDescription:
      typeof test.shortDescription === "string" ? test.shortDescription : "",
    slug: test.slug,
    subjectId: typeof test.subjectId === "string" ? test.subjectId : "",
    title: test.title,
  };
}

export function AdminAssessmentsScreen({
  initialTab,
}: Readonly<{
  initialTab: AssessmentTab;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const taxonomy = useAdminTaxonomyReferenceData();
  const canReadQuestions = authSession.hasPermission("academics.questions.read");
  const canManageQuestions = authSession.hasPermission("academics.questions.manage");
  const canPublishQuestions = authSession.hasPermission("academics.questions.publish");
  const canReadTests = authSession.hasPermission("academics.tests.read");
  const canManageTests = authSession.hasPermission("academics.tests.manage");
  const canPublishTests = authSession.hasPermission("academics.tests.publish");

  const [searchValue, setSearchValue] = useState("");
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus | "">("");
  const [questionType, setQuestionType] = useState<QuestionType | "">("");
  const [questionDifficulty, setQuestionDifficulty] = useState<QuestionDifficulty | "">("");
  const [questionSubjectId, setQuestionSubjectId] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(
    EMPTY_QUESTION_FORM_STATE,
  );

  const [testStatus, setTestStatus] = useState<TestStatus | "">("");
  const [testFamily, setTestFamily] = useState<TestFamily | "">("");
  const [testSubjectId, setTestSubjectId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState<TestFormState>(EMPTY_TEST_FORM_STATE);
  const [message, setMessage] = useState<string | null>(null);

  const questionsQuery = useAuthenticatedQuery({
    enabled: initialTab === "questions" && canReadQuestions,
    queryFn: (accessToken) =>
      listAdminQuestions(accessToken, {
        difficulty: questionDifficulty || undefined,
        search: searchValue || undefined,
        status: questionStatus || undefined,
        subjectId: questionSubjectId || undefined,
        type: questionType || undefined,
      }),
    queryKey: adminQueryKeys.questions({
      difficulty: questionDifficulty || null,
      examTrackId: null,
      hasMedia: null,
      mediumId: null,
      search: searchValue || null,
      status: questionStatus || null,
      subjectId: questionSubjectId || null,
      topicId: null,
      type: questionType || null,
    }),
    staleTime: 30_000,
  });

  const testsQuery = useAuthenticatedQuery({
    enabled: initialTab === "tests" && canReadTests,
    queryFn: (accessToken) =>
      listAdminTests(accessToken, {
        family: testFamily || undefined,
        search: searchValue || undefined,
        status: testStatus || undefined,
        subjectId: testSubjectId || undefined,
      }),
    queryKey: adminQueryKeys.tests({
      examTrackId: null,
      family: testFamily || null,
      mediumId: null,
      search: searchValue || null,
      status: testStatus || null,
      subjectId: testSubjectId || null,
    }),
    staleTime: 30_000,
  });

  const questionDetailQuery = useAuthenticatedQuery({
    enabled: initialTab === "questions" && canReadQuestions && Boolean(selectedQuestionId),
    queryFn: (accessToken) => getAdminQuestion(selectedQuestionId ?? "", accessToken),
    queryKey: ["admin", "questions", "detail", selectedQuestionId ?? "new"],
    staleTime: 30_000,
  });

  const testDetailQuery = useAuthenticatedQuery({
    enabled: initialTab === "tests" && canReadTests && Boolean(selectedTestId),
    queryFn: (accessToken) => getAdminTest(selectedTestId ?? "", accessToken),
    queryKey: ["admin", "tests", "detail", selectedTestId ?? "new"],
    staleTime: 30_000,
  });

  const selectedQuestion = questionDetailQuery.data ?? null;
  const selectedTest = testDetailQuery.data ?? null;

  useEffect(() => {
    setQuestionForm(buildQuestionFormState(selectedQuestion));
  }, [selectedQuestion]);

  useEffect(() => {
    setTestForm(buildTestFormState(selectedTest));
  }, [selectedTest]);

  const questionSaveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        code: questionForm.code.trim() || undefined,
        correctAnswerJson: safeJsonParse(questionForm.correctAnswerJson, {
          label: "Correct answer JSON",
        }) as Record<string, never>,
        difficulty: questionForm.difficulty,
        explanationJson: safeJsonParse(questionForm.explanationJson, {
          allowEmpty: true,
          label: "Explanation JSON",
        }) as Record<string, never> | undefined,
        mediumId: questionForm.mediumId.trim() || undefined,
        metadataJson: safeJsonParse(questionForm.metadataJson, {
          allowEmpty: true,
          label: "Metadata JSON",
        }) as Record<string, never> | undefined,
        options: (safeJsonParseArray(questionForm.optionsJson, {
          allowEmpty: true,
          label: "Options JSON",
        }) ?? []) as Array<{
          contentJson: Record<string, never>;
          metaJson?: Record<string, never>;
          optionKey: string;
          orderIndex?: number;
        }>,
        statementJson: safeJsonParse(questionForm.statementJson, {
          label: "Statement JSON",
        }) as Record<string, never>,
        subjectId: questionForm.subjectId.trim(),
        topicId: questionForm.topicId.trim() || undefined,
        type: questionForm.type,
        mediaReferences: (safeJsonParseArray(questionForm.mediaReferencesJson, {
          allowEmpty: true,
          label: "Media references JSON",
        }) ?? []) as Array<{
          fileAssetId: string;
          localeCode?: string;
          optionKey?: string;
          orderIndex?: number;
          usage: "STATEMENT" | "OPTION" | "EXPLANATION";
        }>,
      };

      if (!input.subjectId) {
        throw new Error("A subject is required.");
      }

      if (selectedQuestionId) {
        return updateAdminQuestion(selectedQuestionId, input, accessToken);
      }

      return createAdminQuestion(input, accessToken);
    },
    onSuccess: async (question) => {
      setSelectedQuestionId(question.id);
      setMessage("Question saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });

  const questionPublishMutation = useAuthenticatedMutation({
    mutationFn: async (action: "publish" | "unpublish", accessToken) => {
      if (!selectedQuestionId) {
        throw new Error("Select a question first.");
      }

      return action === "publish"
        ? publishAdminQuestion(selectedQuestionId, accessToken)
        : unpublishAdminQuestion(selectedQuestionId, accessToken);
    },
    onSuccess: async () => {
      setMessage("Question publication state updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });

  const testSaveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const input = {
        accessType: testForm.accessType,
        availableFrom: toIsoDateTime(testForm.availableFrom),
        availableUntil: toIsoDateTime(testForm.availableUntil),
        code: testForm.code.trim() || undefined,
        configJson: safeJsonParse(testForm.configJson, {
          allowEmpty: true,
          label: "Config JSON",
        }) as Record<string, never> | undefined,
        durationMinutes: parseOptionalInteger(testForm.durationMinutes),
        examTrackId: testForm.examTrackId.trim() || undefined,
        family: testForm.family,
        instructionsJson: safeJsonParse(testForm.instructionsJson, {
          allowEmpty: true,
          label: "Instructions JSON",
        }) as Record<string, never> | undefined,
        maxAttempts: parseOptionalInteger(testForm.maxAttempts),
        mediumId: testForm.mediumId.trim() || undefined,
        questions: (safeJsonParseArray(testForm.questionsJson, {
          allowEmpty: false,
          label: "Questions JSON",
        }) ?? []) as Array<{
          negativeMarks?: number;
          orderIndex?: number;
          positiveMarks?: number;
          questionId: string;
        }>,
        randomizeQuestionOrder: testForm.randomizeQuestionOrder,
        shortDescription: testForm.shortDescription.trim() || undefined,
        slug: testForm.slug.trim() || undefined,
        subjectId: testForm.subjectId.trim() || undefined,
        title: testForm.title.trim(),
      };

      if (!input.title || !input.durationMinutes) {
        throw new Error("Title and duration are required.");
      }

      const normalizedInput = {
        ...input,
        durationMinutes: input.durationMinutes,
      };

      if (selectedTestId) {
        return updateAdminTest(selectedTestId, normalizedInput, accessToken);
      }

      return createAdminTest(normalizedInput, accessToken);
    },
    onSuccess: async (test) => {
      setSelectedTestId(test.id);
      setMessage("Test saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
    },
  });

  const testPublishMutation = useAuthenticatedMutation({
    mutationFn: async (action: "publish" | "unpublish", accessToken) => {
      if (!selectedTestId) {
        throw new Error("Select a test first.");
      }

      return action === "publish"
        ? publishAdminTest(selectedTestId, accessToken)
        : unpublishAdminTest(selectedTestId, accessToken);
    },
    onSuccess: async () => {
      setMessage("Test publication state updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "tests"] });
    },
  });

  const activeCanRead = initialTab === "questions" ? canReadQuestions : canReadTests;

  if (!activeCanRead) {
    return (
      <EmptyState
        eyebrow="Access"
        title="This assessment workspace is locked."
        description="The current session does not expose read access for the requested assessment module."
      />
    );
  }

  if (
    (initialTab === "questions" && (questionsQuery.isLoading || questionDetailQuery.isLoading)) ||
    (initialTab === "tests" && (testsQuery.isLoading || testDetailQuery.isLoading))
  ) {
    return (
      <LoadingState
        title={`Loading ${initialTab} workspace`}
        description="Pulling assessment records and editor detail from the backend admin APIs."
      />
    );
  }

  if (
    (initialTab === "questions" && (questionsQuery.error || questionDetailQuery.error)) ||
    (initialTab === "tests" && (testsQuery.error || testDetailQuery.error))
  ) {
    return (
      <ErrorState
        title="The assessment workspace could not be loaded."
        description="One or more assessment queries failed, so the editor could not render safely."
        onRetry={() => {
          if (initialTab === "questions") {
            void questionsQuery.refetch();
            void questionDetailQuery.refetch();
            return;
          }

          void testsQuery.refetch();
          void testDetailQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Assessments"
        title={
          initialTab === "questions"
            ? "Question bank authoring is live."
            : "Test authoring and publish flows are live."
        }
        description={
          initialTab === "questions"
            ? "This editor writes directly to the backend question DTOs, including statement blocks, option arrays, correct-answer JSON, and media references."
            : "This editor now owns test metadata, timing, question composition, and publication state through the backend test contracts."
        }
      />

      <AdminRouteTabs
        activeHref={initialTab === "questions" ? "/admin/questions" : "/admin/tests"}
        items={[
          {
            href: "/admin/questions",
            label: "Questions",
            description: "Question bank, difficulty, options, answers, and media references.",
          },
          {
            href: "/admin/tests",
            label: "Tests",
            description: "Timed test definitions, question mixes, and publish lifecycle.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={
          initialTab === "questions"
            ? "Search questions by code or statement"
            : "Search tests by title, slug, or description"
        }
        resultSummary={`${
          initialTab === "questions"
            ? questionsQuery.data?.items.length ?? 0
            : testsQuery.data?.items.length ?? 0
        } ${initialTab} visible.`}
      >
        {initialTab === "questions" ? (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Status</span>
              <select
                value={questionStatus}
                onChange={(event) =>
                  setQuestionStatus(event.target.value as QuestionStatus | "")
                }
                className="tc-input"
              >
                <option value="">All statuses</option>
                {QUESTION_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Type</span>
              <select
                value={questionType}
                onChange={(event) =>
                  setQuestionType(event.target.value as QuestionType | "")
                }
                className="tc-input"
              >
                <option value="">All types</option>
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Difficulty</span>
              <select
                value={questionDifficulty}
                onChange={(event) =>
                  setQuestionDifficulty(event.target.value as QuestionDifficulty | "")
                }
                className="tc-input"
              >
                <option value="">All difficulties</option>
                {QUESTION_DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Subject</span>
              <select
                value={questionSubjectId}
                onChange={(event) => setQuestionSubjectId(event.target.value)}
                className="tc-input"
              >
                <option value="">All subjects</option>
                {taxonomy.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Status</span>
              <select
                value={testStatus}
                onChange={(event) => setTestStatus(event.target.value as TestStatus | "")}
                className="tc-input"
              >
                <option value="">All statuses</option>
                {TEST_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Family</span>
              <select
                value={testFamily}
                onChange={(event) => setTestFamily(event.target.value as TestFamily | "")}
                className="tc-input"
              >
                <option value="">All families</option>
                {TEST_FAMILY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="tc-form-field min-w-[12rem]">
              <span className="tc-form-label">Subject</span>
              <select
                value={testSubjectId}
                onChange={(event) => setTestSubjectId(event.target.value)}
                className="tc-input"
              >
                <option value="">All subjects</option>
                {taxonomy.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}
      {initialTab === "questions" && questionSaveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(questionSaveMutation.error, "The question could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "questions" && questionPublishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            questionPublishMutation.error,
            "The question publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "tests" && testSaveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(testSaveMutation.error, "The test could not be saved.")}
        </AdminInlineNotice>
      ) : null}
      {initialTab === "tests" && testPublishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            testPublishMutation.error,
            "The test publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <section>
          {initialTab === "questions" ? (
            <AdminDataTable
              rows={questionsQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedQuestionId}
              onRowClick={(row) => setSelectedQuestionId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Questions"
                  title="No questions matched the current filters."
                  description="Broaden the filters or create a new question to seed the question bank."
                />
              }
              columns={[
                {
                  header: "Question",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">
                        {getOptionalText(row.code) ?? "Untitled question"}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.subject.name}
                        {row.topic ? ` · ${row.topic.name}` : ""}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Type",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <AdminToneBadge label={row.type} tone="info" />
                      <AdminToneBadge
                        label={row.difficulty}
                        tone={row.difficulty === "EASY" ? "live" : row.difficulty === "HARD" ? "danger" : "warning"}
                      />
                    </div>
                  ),
                },
                {
                  header: "Status",
                  render: (row) => (
                    <AdminToneBadge
                      label={row.status}
                      tone={row.status === "PUBLISHED" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                    />
                  ),
                },
                {
                  header: "Updated",
                  render: (row) => formatAdminDateTime(row.updatedAt),
                },
              ]}
            />
          ) : (
            <AdminDataTable
              rows={testsQuery.data?.items ?? []}
              getRowId={(row) => row.id}
              selectedRowId={selectedTestId}
              onRowClick={(row) => setSelectedTestId(row.id)}
              emptyState={
                <EmptyState
                  eyebrow="Tests"
                  title="No tests matched the current filters."
                  description="Broaden the filters or create a new test to start the assessment catalog."
                />
              }
              columns={[
                {
                  header: "Test",
                  render: (row) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-[color:var(--brand)]">{row.title}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {row.family} · {row.slug}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Access",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <AdminToneBadge
                        label={row.status}
                        tone={row.status === "PUBLISHED" ? "live" : row.status === "ARCHIVED" ? "danger" : "warning"}
                      />
                      <AdminToneBadge
                        label={row.accessType}
                        tone={row.accessType === "FREE" ? "live" : "warning"}
                      />
                    </div>
                  ),
                },
                {
                  header: "Timing",
                  render: (row) => (
                    <p className="text-sm text-[color:var(--muted)]">
                      {row.durationMinutes} min · {row.questionCount} qns
                    </p>
                  ),
                },
                {
                  header: "Updated",
                  render: (row) => formatAdminDateTime(row.updatedAt),
                },
              ]}
            />
          )}
        </section>

        <section className="tc-card rounded-[28px] p-6">
          {initialTab === "questions" ? (
            <div className="grid gap-4">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                {selectedQuestionId ? "Update question" : "Create question"}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Code"
                  value={questionForm.code}
                  onChange={(event) =>
                    setQuestionForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
                <AdminSelect
                  label="Type"
                  value={questionForm.type}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      type: event.target.value as QuestionType,
                    }))
                  }
                >
                  {QUESTION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <AdminSelect
                  label="Difficulty"
                  value={questionForm.difficulty}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      difficulty: event.target.value as QuestionDifficulty,
                    }))
                  }
                >
                  {QUESTION_DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Subject"
                  value={questionForm.subjectId}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      subjectId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select subject</option>
                  {taxonomy.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Topic"
                  value={questionForm.topicId}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      topicId: event.target.value,
                    }))
                  }
                >
                  <option value="">Optional topic</option>
                  {taxonomy.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <AdminInput
                label="Medium ID"
                value={questionForm.mediumId}
                onChange={(event) =>
                  setQuestionForm((current) => ({ ...current, mediumId: event.target.value }))
                }
              />
              <AdminTextarea
                label="Statement JSON"
                value={questionForm.statementJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    statementJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Options JSON"
                hint='Example: [{"optionKey":"A","contentJson":{"blocks":[{"type":"paragraph","text":"Option"}]}}]'
                value={questionForm.optionsJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    optionsJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Correct answer JSON"
                value={questionForm.correctAnswerJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    correctAnswerJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Explanation JSON"
                value={questionForm.explanationJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    explanationJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Metadata JSON"
                value={questionForm.metadataJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    metadataJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Media references JSON"
                value={questionForm.mediaReferencesJson}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    mediaReferencesJson: event.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageQuestions || questionSaveMutation.isPending}
                  onClick={() => questionSaveMutation.mutate()}
                >
                  {questionSaveMutation.isPending ? "Saving..." : "Save question"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!selectedQuestionId || !canPublishQuestions || questionPublishMutation.isPending}
                  onClick={() =>
                    questionPublishMutation.mutate(
                      selectedQuestion?.status === "PUBLISHED" ? "unpublish" : "publish",
                    )
                  }
                >
                  {selectedQuestion?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <h2 className="tc-display text-2xl font-semibold tracking-tight">
                {selectedTestId ? "Update test" : "Create test"}
              </h2>
              <AdminInput
                label="Title"
                value={testForm.title}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, title: event.target.value }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Code"
                  value={testForm.code}
                  onChange={(event) =>
                    setTestForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
                <AdminInput
                  label="Slug"
                  value={testForm.slug}
                  onChange={(event) =>
                    setTestForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <AdminSelect
                  label="Family"
                  value={testForm.family}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      family: event.target.value as TestFamily,
                    }))
                  }
                >
                  {TEST_FAMILY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Access type"
                  value={testForm.accessType}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      accessType: event.target.value as TestAccessType,
                    }))
                  }
                >
                  {TEST_ACCESS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  label="Duration minutes"
                  type="number"
                  value={testForm.durationMinutes}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <AdminSelect
                  label="Exam track"
                  value={testForm.examTrackId}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      examTrackId: event.target.value,
                    }))
                  }
                >
                  <option value="">Optional exam track</option>
                  {taxonomy.examTracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Subject"
                  value={testForm.subjectId}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      subjectId: event.target.value,
                    }))
                  }
                >
                  <option value="">Optional subject</option>
                  {taxonomy.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Medium"
                  value={testForm.mediumId}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      mediumId: event.target.value,
                    }))
                  }
                >
                  <option value="">Optional medium</option>
                  {taxonomy.mediums.map((medium) => (
                    <option key={medium.id} value={medium.id}>
                      {medium.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminInput
                  label="Available from"
                  type="datetime-local"
                  value={testForm.availableFrom}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      availableFrom: event.target.value,
                    }))
                  }
                />
                <AdminInput
                  label="Available until"
                  type="datetime-local"
                  value={testForm.availableUntil}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      availableUntil: event.target.value,
                    }))
                  }
                />
              </div>
              <AdminInput
                label="Max attempts"
                type="number"
                value={testForm.maxAttempts}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    maxAttempts: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Short description"
                value={testForm.shortDescription}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Instructions JSON"
                value={testForm.instructionsJson}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    instructionsJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Config JSON"
                value={testForm.configJson}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    configJson: event.target.value,
                  }))
                }
              />
              <AdminTextarea
                label="Questions JSON"
                hint='Example: [{"questionId":"id","orderIndex":10,"positiveMarks":2,"negativeMarks":0.5}]'
                value={testForm.questionsJson}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    questionsJson: event.target.value,
                  }))
                }
              />
              <label className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 px-4 py-3 text-sm font-medium text-[color:var(--brand)]">
                <input
                  type="checkbox"
                  checked={testForm.randomizeQuestionOrder}
                  onChange={(event) =>
                    setTestForm((current) => ({
                      ...current,
                      randomizeQuestionOrder: event.target.checked,
                    }))
                  }
                />
                Randomize question order for student attempts.
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={!canManageTests || testSaveMutation.isPending}
                  onClick={() => testSaveMutation.mutate()}
                >
                  {testSaveMutation.isPending ? "Saving..." : "Save test"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!selectedTestId || !canPublishTests || testPublishMutation.isPending}
                  onClick={() =>
                    testPublishMutation.mutate(
                      selectedTest?.status === "PUBLISHED" ? "unpublish" : "publish",
                    )
                  }
                >
                  {selectedTest?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
