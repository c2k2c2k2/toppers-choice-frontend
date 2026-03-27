"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminQuestion,
  formatAdminDateTime,
  getAdminQuestion,
  getApiErrorMessage,
  publishAdminQuestion,
  unpublishAdminQuestion,
  updateAdminQuestion,
  type CreateQuestionInput,
  type QuestionDetail,
  type QuestionDifficulty,
  type QuestionType,
  type UpdateQuestionInput,
} from "@/lib/admin";
import { getMarathiFontKeyFromValue } from "@/lib/marathi";
import { StructuredContentRenderer } from "@/components/content/structured-content-renderer";
import {
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

type QuestionLanguageMode = "ENGLISH" | "MARATHI" | "BILINGUAL";
type MarathiFontChoice = "" | "shree-dev" | "surekh";

interface QuestionOptionState {
  englishText: string;
  key: string;
  marathiText: string;
}

interface QuestionFormState {
  acceptedAnswers: string;
  code: string;
  correctOptionKeys: string[];
  difficulty: QuestionDifficulty;
  explanationEn: string;
  explanationMr: string;
  languageMode: QuestionLanguageMode;
  marathiFontHint: MarathiFontChoice;
  mediumId: string;
  options: QuestionOptionState[];
  statementEn: string;
  statementMr: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
}

const QUESTION_OPTION_KEYS = ["A", "B", "C", "D"] as const;
const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TEXT_INPUT",
];
const QUESTION_DIFFICULTY_OPTIONS: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD"];

const EMPTY_FORM: QuestionFormState = {
  acceptedAnswers: "",
  code: "",
  correctOptionKeys: [],
  difficulty: "MEDIUM",
  explanationEn: "",
  explanationMr: "",
  languageMode: "ENGLISH",
  marathiFontHint: "",
  mediumId: "",
  options: QUESTION_OPTION_KEYS.map((key) => ({
    englishText: "",
    key,
    marathiText: "",
  })),
  statementEn: "",
  statementMr: "",
  subjectId: "",
  topicId: "",
  type: "SINGLE_CHOICE",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getCandidateNode(document: unknown, locale: "en" | "mr") {
  if (!isRecord(document)) {
    return document;
  }

  const keys = locale === "en" ? ["en-IN", "en"] : ["mr-IN", "mr"];
  for (const key of keys) {
    if (document[key] !== undefined) {
      return document[key];
    }
  }

  if (isRecord(document.translations)) {
    for (const key of keys) {
      if (document.translations[key] !== undefined) {
        return document.translations[key];
      }
    }
  }

  return document;
}

function readStructuredText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => readStructuredText(entry)).filter(Boolean).join("\n");
  }

  if (!isRecord(value)) {
    return "";
  }

  if (typeof value.text === "string" && value.text.trim()) {
    return value.text;
  }

  if (Array.isArray(value.blocks)) {
    return value.blocks
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }

        if (!isRecord(block)) {
          return "";
        }

        return [
          typeof block.title === "string" ? block.title : "",
          typeof block.text === "string" ? block.text : "",
          typeof block.content === "string" ? block.content : "",
        ]
          .filter(Boolean)
          .join(" ");
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value.html === "string" && value.html.trim()) {
    return value.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (isRecord(value.translations)) {
    return Object.values(value.translations)
      .map((entry) => readStructuredText(entry))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function buildContentLeaf(text: string, fontHint: MarathiFontChoice) {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  return {
    ...(fontHint ? { fontHint } : {}),
    text: normalized,
  };
}

function buildLocalizedDocument(input: {
  englishText: string;
  languageMode: QuestionLanguageMode;
  marathiFontHint: MarathiFontChoice;
  marathiText: string;
}) {
  const englishLeaf =
    input.languageMode === "MARATHI"
      ? null
      : buildContentLeaf(input.englishText, "");
  const marathiLeaf =
    input.languageMode === "ENGLISH"
      ? null
      : buildContentLeaf(input.marathiText, input.marathiFontHint);

  if (englishLeaf && marathiLeaf) {
    return {
      "en-IN": englishLeaf,
      "mr-IN": marathiLeaf,
    };
  }

  if (marathiLeaf) {
    return {
      "mr-IN": marathiLeaf,
    };
  }

  if (englishLeaf) {
    return {
      "en-IN": englishLeaf,
    };
  }

  return null;
}

function detectLanguageMode(question: QuestionDetail): QuestionLanguageMode {
  const hasEnglish = Boolean(readStructuredText(getCandidateNode(question.statementJson, "en")));
  const hasMarathi =
    Boolean(readStructuredText(getCandidateNode(question.statementJson, "mr"))) ||
    question.options.some((option) =>
      Boolean(readStructuredText(getCandidateNode(option.contentJson, "mr"))),
    ) ||
    Boolean(readStructuredText(getCandidateNode(question.explanationJson, "mr")));

  if (hasEnglish && hasMarathi) {
    return "BILINGUAL";
  }

  if (hasMarathi) {
    return "MARATHI";
  }

  return "ENGLISH";
}

function buildFormState(question: QuestionDetail | null): QuestionFormState {
  if (!question) {
    return EMPTY_FORM;
  }

  const mode = detectLanguageMode(question);
  const correctAnswerJson = isRecord(question.correctAnswerJson)
    ? question.correctAnswerJson
    : {};
  const marathiFontHint =
    getMarathiFontKeyFromValue(question.statementJson) ??
    getMarathiFontKeyFromValue(question.options.map((option) => option.contentJson)) ??
    getMarathiFontKeyFromValue(question.explanationJson) ??
    "";
  const options = QUESTION_OPTION_KEYS.map((key) => {
    const option = question.options.find((entry) => entry.optionKey === key);
    return {
      englishText: option ? readStructuredText(getCandidateNode(option.contentJson, "en")) : "",
      key,
      marathiText: option ? readStructuredText(getCandidateNode(option.contentJson, "mr")) : "",
    };
  });

  return {
    acceptedAnswers: readStringArray(correctAnswerJson.acceptedAnswers).join("\n"),
    code: readStringValue(question.code),
    correctOptionKeys: readStringArray(correctAnswerJson.optionKeys),
    difficulty: question.difficulty,
    explanationEn: readStructuredText(getCandidateNode(question.explanationJson, "en")),
    explanationMr: readStructuredText(getCandidateNode(question.explanationJson, "mr")),
    languageMode: mode,
    marathiFontHint,
    mediumId: readStringValue(question.mediumId),
    options,
    statementEn: readStructuredText(getCandidateNode(question.statementJson, "en")),
    statementMr: readStructuredText(getCandidateNode(question.statementJson, "mr")),
    subjectId: readStringValue(question.subjectId),
    topicId: readStringValue(question.topicId),
    type: question.type,
  };
}

type AdminTaxonomyReferenceData = ReturnType<typeof useAdminTaxonomyReferenceData>;

function buildInitialQuestionForm(
  question: QuestionDetail | null,
  defaultSubjectId: string,
): QuestionFormState {
  if (question) {
    return buildFormState(question);
  }

  return {
    ...EMPTY_FORM,
    subjectId: defaultSubjectId,
  };
}

function countFilledOptions(form: QuestionFormState) {
  return form.options.filter((option) => {
    if (form.languageMode === "MARATHI") {
      return option.marathiText.trim().length > 0;
    }

    if (form.languageMode === "BILINGUAL") {
      return option.englishText.trim().length > 0 || option.marathiText.trim().length > 0;
    }

    return option.englishText.trim().length > 0;
  }).length;
}

function canSaveQuestion(form: QuestionFormState) {
  const hasStatement =
    (form.languageMode !== "MARATHI" && form.statementEn.trim().length > 0) ||
    (form.languageMode !== "ENGLISH" && form.statementMr.trim().length > 0);

  if (!form.subjectId || !hasStatement) {
    return false;
  }

  if (form.type === "TEXT_INPUT") {
    return form.acceptedAnswers
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean).length > 0;
  }

  return countFilledOptions(form) >= 2 && form.correctOptionKeys.length > 0;
}

function buildQuestionPayload(form: QuestionFormState): CreateQuestionInput | UpdateQuestionInput {
  const statementJson = buildLocalizedDocument({
    englishText: form.statementEn,
    languageMode: form.languageMode,
    marathiFontHint: form.marathiFontHint,
    marathiText: form.statementMr,
  }) as Record<string, unknown> | null;

  const explanationJson = buildLocalizedDocument({
    englishText: form.explanationEn,
    languageMode: form.languageMode,
    marathiFontHint: form.marathiFontHint,
    marathiText: form.explanationMr,
  }) as Record<string, unknown> | null;

  const payload = {
    code: form.code.trim() || undefined,
    correctAnswerJson: (
      form.type === "TEXT_INPUT"
        ? {
            acceptedAnswers: form.acceptedAnswers
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
          }
        : {
            optionKeys: form.correctOptionKeys,
          }
    ) as Record<string, unknown>,
    difficulty: form.difficulty,
    explanationJson: explanationJson ?? undefined,
    mediumId: form.mediumId || undefined,
    metadataJson: {
      languageMode: form.languageMode,
      ...(form.marathiFontHint ? { marathiFontHint: form.marathiFontHint } : {}),
    } as Record<string, unknown>,
    statementJson: statementJson ?? {},
    subjectId: form.subjectId,
    topicId: form.topicId || undefined,
    type: form.type,
    ...(form.type === "TEXT_INPUT"
      ? {}
      : {
          options: form.options
            .map((option, index) => ({
              contentJson: (buildLocalizedDocument({
                  englishText: option.englishText,
                  languageMode: form.languageMode,
                  marathiFontHint: form.marathiFontHint,
                  marathiText: option.marathiText,
                }) ?? {}) as Record<string, unknown>,
              optionKey: option.key,
              orderIndex: (index + 1) * 10,
            }))
            .filter((option) => {
              return Object.keys(option.contentJson).length > 0;
            }),
        }),
  };

  return payload as unknown as CreateQuestionInput | UpdateQuestionInput;
}

function buildPreviewOptionDocument(
  option: QuestionOptionState,
  form: QuestionFormState,
) {
  return buildLocalizedDocument({
    englishText: option.englishText,
    languageMode: form.languageMode,
    marathiFontHint: form.marathiFontHint,
    marathiText: option.marathiText,
  });
}

export function AdminQuestionEditorScreen({
  questionId,
}: Readonly<{
  questionId?: string;
}>) {
  const authSession = useAuthSession();
  const taxonomy = useAdminTaxonomyReferenceData();
  const isEdit = Boolean(questionId);
  const canReadQuestions = authSession.hasPermission("academics.questions.read");
  const canManageQuestions = authSession.hasPermission("academics.questions.manage");
  const canPublishQuestions = authSession.hasPermission("academics.questions.publish");

  const questionQuery = useAuthenticatedQuery({
    enabled: Boolean(questionId) && canReadQuestions,
    queryFn: (accessToken) => getAdminQuestion(questionId!, accessToken),
    queryKey: questionId ? ["admin", "question", questionId] : ["admin", "question", "new"],
    staleTime: 15_000,
  });

  if (!canReadQuestions && isEdit) {
    return (
      <EmptyState
        eyebrow="Question bank"
        title="This session cannot open the question editor."
        description="Ask an administrator to grant question access to this account."
      />
    );
  }

  if ((questionQuery.isLoading && isEdit) || taxonomy.isLoading) {
    return (
      <LoadingState
        title={isEdit ? "Loading question editor" : "Preparing question editor"}
        description="Loading the question details and taxonomy."
      />
    );
  }

  if (questionQuery.isError && isEdit) {
    return (
      <ErrorState
        title="The question editor could not load."
        description="We couldn't finish loading this question record."
        onRetry={() => void questionQuery.refetch()}
      />
    );
  }

  return (
    <AdminQuestionEditorForm
      key={
        questionId
          ? `${questionId}:${questionQuery.data?.updatedAt ?? "initial"}`
          : `new:${taxonomy.subjects[0]?.id ?? "unassigned"}`
      }
      canManageQuestions={canManageQuestions}
      canPublishQuestions={canPublishQuestions}
      isEdit={isEdit}
      question={questionQuery.data ?? null}
      questionId={questionId}
      taxonomy={taxonomy}
    />
  );
}

function AdminQuestionEditorForm({
  canManageQuestions,
  canPublishQuestions,
  isEdit,
  question,
  questionId,
  taxonomy,
}: Readonly<{
  canManageQuestions: boolean;
  canPublishQuestions: boolean;
  isEdit: boolean;
  question: QuestionDetail | null;
  questionId?: string;
  taxonomy: AdminTaxonomyReferenceData;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDetail | null>(question);
  const [form, setForm] = useState<QuestionFormState>(() =>
    buildInitialQuestionForm(question, taxonomy.subjects[0]?.id ?? ""),
  );
  const [message, setMessage] = useState<string | null>(null);

  const selectedSubjectTopics = useMemo(
    () => (form.subjectId ? taxonomy.topicsBySubjectId[form.subjectId] ?? [] : []),
    [form.subjectId, taxonomy.topicsBySubjectId],
  );

  const saveMutation = useAuthenticatedMutation({
    mutationFn: (_unused: void, accessToken: string) => {
      const payload = buildQuestionPayload(form);
      return isEdit && questionId
        ? updateAdminQuestion(questionId, payload as UpdateQuestionInput, accessToken)
        : createAdminQuestion(payload as CreateQuestionInput, accessToken);
    },
    onSuccess: async (savedQuestion) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "questions"],
      });

      if (!isEdit) {
        router.replace(`/admin/questions/${savedQuestion.id}`);
        return;
      }

      setMessage("Question saved.");
      setCurrentQuestion(savedQuestion);
      setForm(buildFormState(savedQuestion));
      await queryClient.invalidateQueries({
        queryKey: ["admin", "question", savedQuestion.id],
      });
    },
  });

  const publishMutation = useAuthenticatedMutation({
    mutationFn: (action: "publish" | "unpublish", accessToken: string) =>
      action === "publish"
        ? publishAdminQuestion(questionId!, accessToken)
        : unpublishAdminQuestion(questionId!, accessToken),
    onSuccess: async (savedQuestion, action) => {
      setMessage(
        action === "publish" ? "Question published." : "Question moved back to draft.",
      );
      setCurrentQuestion(savedQuestion);
      setForm(buildFormState(savedQuestion));
      await queryClient.invalidateQueries({
        queryKey: ["admin", "questions"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "question", savedQuestion.id],
      });
    },
  });

  const statementPreview = buildLocalizedDocument({
    englishText: form.statementEn,
    languageMode: form.languageMode,
    marathiFontHint: form.marathiFontHint,
    marathiText: form.statementMr,
  });
  const explanationPreview = buildLocalizedDocument({
    englishText: form.explanationEn,
    languageMode: form.languageMode,
    marathiFontHint: form.marathiFontHint,
    marathiText: form.explanationMr,
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Assessment management"
        title={isEdit ? "Edit question" : "Create question"}
        description="Keep question entry readable for admins: choose the type, write the statement, add options if needed, and save the structured payload automatically."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/questions" className="tc-button-secondary">
              Back to question bank
            </Link>
            {isEdit ? (
              <button
                type="button"
                className="tc-button-secondary"
                disabled={!canPublishQuestions || publishMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  publishMutation.mutate(
                    currentQuestion?.status === "PUBLISHED" ? "unpublish" : "publish",
                  );
                }}
              >
                {currentQuestion?.status === "PUBLISHED" ? "Move to draft" : "Publish"}
              </button>
            ) : null}
            <button
              type="button"
              className="tc-button-primary"
              disabled={!canManageQuestions || !canSaveQuestion(form) || saveMutation.isPending}
              onClick={() => {
                setMessage(null);
                saveMutation.mutate();
              }}
            >
              {saveMutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save question"
                  : "Create question"}
            </button>
          </div>
        }
      />

      <AdminRouteTabs
        activeHref="/admin/questions"
        items={[
          {
            href: "/admin/questions",
            label: "Questions",
            description: "Return to the full question listing.",
          },
          {
            href: "/admin/tests",
            label: "Tests",
            description: "Build tests from published questions.",
          },
        ]}
      />

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

      {saveMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(saveMutation.error, "The question could not be saved.")}
        </AdminInlineNotice>
      ) : null}

      {publishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            publishMutation.error,
            "The question publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      {isEdit && currentQuestion ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Status</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--brand)]">
              {currentQuestion.status}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Type</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentQuestion.type.replaceAll("_", " ")}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Difficulty</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentQuestion.difficulty}
            </p>
          </div>
          <div className="tc-glass rounded-[22px] p-4">
            <p className="tc-overline">Updated</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {formatAdminDateTime(currentQuestion.updatedAt)}
            </p>
          </div>
        </div>
      ) : null}

      <section className="tc-card rounded-[28px] p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminInput
            label="Code"
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({ ...current, code: event.target.value }))
            }
            placeholder="polity-fr-001"
          />
          <AdminSelect
            label="Question type"
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                correctOptionKeys: [],
                type: event.target.value as QuestionType,
              }))
            }
          >
            {QUESTION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Difficulty"
            value={form.difficulty}
            onChange={(event) =>
              setForm((current) => ({
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
            value={form.subjectId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                subjectId: event.target.value,
                topicId: "",
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
            value={form.topicId}
            onChange={(event) =>
              setForm((current) => ({ ...current, topicId: event.target.value }))
            }
          >
            <option value="">No topic</option>
            {selectedSubjectTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Medium"
            value={form.mediumId}
            onChange={(event) =>
              setForm((current) => ({ ...current, mediumId: event.target.value }))
            }
          >
            <option value="">All mediums</option>
            {taxonomy.mediums.map((medium) => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Language mode"
            value={form.languageMode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                languageMode: event.target.value as QuestionLanguageMode,
              }))
            }
          >
            <option value="ENGLISH">English only</option>
            <option value="MARATHI">Marathi only</option>
            <option value="BILINGUAL">English + Marathi</option>
          </AdminSelect>
          <AdminSelect
            label="Marathi font"
            value={form.marathiFontHint}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                marathiFontHint: event.target.value as MarathiFontChoice,
              }))
            }
            disabled={form.languageMode === "ENGLISH"}
          >
            <option value="">Unicode / default</option>
            <option value="shree-dev">Shree Dev</option>
            <option value="surekh">Surekh / Sulekha</option>
          </AdminSelect>
        </div>
      </section>

      <section className="tc-card rounded-[28px] p-6">
        <h2 className="tc-display text-2xl font-semibold tracking-tight">Question statement</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {form.languageMode !== "MARATHI" ? (
            <AdminTextarea
              label="English statement"
              value={form.statementEn}
              onChange={(event) =>
                setForm((current) => ({ ...current, statementEn: event.target.value }))
              }
              placeholder="What is the capital of India?"
            />
          ) : null}
          {form.languageMode !== "ENGLISH" ? (
            <AdminTextarea
              label="Marathi statement"
              value={form.statementMr}
              onChange={(event) =>
                setForm((current) => ({ ...current, statementMr: event.target.value }))
              }
              placeholder="भारताची राजधानी कोणती?"
              className={
                form.marathiFontHint === "shree-dev"
                  ? "font-marathi-shree-dev font-marathi-encoded"
                  : form.marathiFontHint === "surekh"
                    ? "font-marathi-surekh font-marathi-encoded"
                    : "font-marathi-unicode"
              }
            />
          ) : null}
        </div>
      </section>

      {form.type === "TEXT_INPUT" ? (
        <section className="tc-card rounded-[28px] p-6">
          <h2 className="tc-display text-2xl font-semibold tracking-tight">Accepted answers</h2>
          <p className="tc-muted mt-3 text-sm leading-7">
            Add one accepted answer per line. The student answer will be checked against this list.
          </p>
          <div className="mt-5">
            <AdminTextarea
              label="Accepted answers"
              value={form.acceptedAnswers}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  acceptedAnswers: event.target.value,
                }))
              }
              placeholder={"Delhi\nNew Delhi"}
            />
          </div>
        </section>
      ) : (
        <section className="tc-card rounded-[28px] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="tc-display text-2xl font-semibold tracking-tight">Options</h2>
              <p className="tc-muted mt-3 text-sm leading-7">
                Fill at least two options and mark the correct answer below.
              </p>
            </div>
            <span className="tc-code-chip">
              Correct: {form.correctOptionKeys.length > 0 ? form.correctOptionKeys.join(", ") : "none"}
            </span>
          </div>
          <div className="mt-5 grid gap-4">
            {form.options.map((option) => {
              const isCorrect = form.correctOptionKeys.includes(option.key);

              return (
                <div
                  key={option.key}
                  className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tc-code-chip">{option.key}</span>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--brand)]">
                      <input
                        type={form.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                        name="correct-option"
                        checked={isCorrect}
                        onChange={() => {
                          setForm((current) => ({
                            ...current,
                            correctOptionKeys:
                              current.type === "MULTIPLE_CHOICE"
                                ? isCorrect
                                  ? current.correctOptionKeys.filter((key) => key !== option.key)
                                  : [...current.correctOptionKeys, option.key]
                                : [option.key],
                          }));
                        }}
                      />
                      Correct answer
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {form.languageMode !== "MARATHI" ? (
                      <AdminTextarea
                        label={`English option ${option.key}`}
                        value={option.englishText}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            options: current.options.map((entry) =>
                              entry.key === option.key
                                ? {
                                    ...entry,
                                    englishText: event.target.value,
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                    ) : null}
                    {form.languageMode !== "ENGLISH" ? (
                      <AdminTextarea
                        label={`Marathi option ${option.key}`}
                        value={option.marathiText}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            options: current.options.map((entry) =>
                              entry.key === option.key
                                ? {
                                    ...entry,
                                    marathiText: event.target.value,
                                  }
                                : entry,
                            ),
                          }))
                        }
                        className={
                          form.marathiFontHint === "shree-dev"
                            ? "font-marathi-shree-dev font-marathi-encoded"
                            : form.marathiFontHint === "surekh"
                              ? "font-marathi-surekh font-marathi-encoded"
                              : "font-marathi-unicode"
                        }
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="tc-card rounded-[28px] p-6">
        <h2 className="tc-display text-2xl font-semibold tracking-tight">Explanation</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {form.languageMode !== "MARATHI" ? (
            <AdminTextarea
              label="English explanation"
              value={form.explanationEn}
              onChange={(event) =>
                setForm((current) => ({ ...current, explanationEn: event.target.value }))
              }
              placeholder="Explain why the answer is correct."
            />
          ) : null}
          {form.languageMode !== "ENGLISH" ? (
            <AdminTextarea
              label="Marathi explanation"
              value={form.explanationMr}
              onChange={(event) =>
                setForm((current) => ({ ...current, explanationMr: event.target.value }))
              }
              placeholder="योग्य उत्तर का आहे ते समजवा."
              className={
                form.marathiFontHint === "shree-dev"
                  ? "font-marathi-shree-dev font-marathi-encoded"
                  : form.marathiFontHint === "surekh"
                    ? "font-marathi-surekh font-marathi-encoded"
                    : "font-marathi-unicode"
              }
            />
          ) : null}
        </div>
      </section>

      <section className="tc-card rounded-[28px] p-6">
        <h2 className="tc-display text-2xl font-semibold tracking-tight">Preview</h2>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-5">
            <p className="tc-overline">Statement</p>
            <div className="mt-3">
              <StructuredContentRenderer
                bodyJson={statementPreview ?? { text: "Add a statement to preview it." }}
                preferredLocaleKeys={["mr-IN", "en-IN", "mr", "en"]}
                showLocaleBadge={false}
              />
            </div>

            {form.type !== "TEXT_INPUT" ? (
              <div className="mt-5 grid gap-3">
                {form.options.map((option) => {
                  const previewDocument = buildPreviewOptionDocument(option, form);
                  if (!previewDocument) {
                    return null;
                  }

                  return (
                    <div
                      key={option.key}
                      className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="tc-code-chip">{option.key}</span>
                        {form.correctOptionKeys.includes(option.key) ? (
                          <span className="tc-code-chip">Correct</span>
                        ) : null}
                      </div>
                      <div className="mt-3">
                        <StructuredContentRenderer
                          bodyJson={previewDocument}
                          preferredLocaleKeys={["mr-IN", "en-IN", "mr", "en"]}
                          showLocaleBadge={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-5">
            <p className="tc-overline">Explanation</p>
            <div className="mt-3">
              <StructuredContentRenderer
                bodyJson={explanationPreview ?? { text: "Add an explanation if you want one." }}
                preferredLocaleKeys={["mr-IN", "en-IN", "mr", "en"]}
                showLocaleBadge={false}
              />
            </div>
            <div className="mt-5 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-[rgba(0,51,102,0.03)] p-4 text-sm leading-7 text-[color:var(--brand)]">
              {form.type === "TEXT_INPUT"
                ? `Accepted answers: ${
                    form.acceptedAnswers
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .join(", ") || "none"
                  }`
                : `Correct option keys: ${form.correctOptionKeys.join(", ") || "none"}`}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
