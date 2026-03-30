"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
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
import {
  buildStructuredDocumentFromHtml,
  htmlToPlainText,
  readStructuredDocumentHtml,
} from "@/lib/admin/rich-text";
import {
  AdminInput,
  AdminSelect,
} from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminQuestionMediaField } from "@/components/admin/admin-question-media-field";
import { AdminQuestionRichTextField } from "@/components/admin/admin-question-rich-text-field";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { QuestionRichTextRenderer } from "@/components/questions/question-rich-text-renderer";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import {
  extractQuestionHtml,
  hasQuestionRichContent,
} from "@/lib/questions/rich-content";

type QuestionLanguageMode = "ENGLISH" | "MARATHI" | "BILINGUAL";

interface QuestionOptionState {
  englishHtml: string;
  imageAssetId: string;
  key: string;
  marathiHtml: string;
}

interface QuestionFormState {
  acceptedAnswers: string;
  code: string;
  correctOptionKeys: string[];
  difficulty: QuestionDifficulty;
  explanationEnHtml: string;
  explanationImageAssetId: string;
  explanationMrHtml: string;
  languageMode: QuestionLanguageMode;
  mediumId: string;
  options: QuestionOptionState[];
  statementEnHtml: string;
  statementImageAssetId: string;
  statementMrHtml: string;
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
const QUESTION_LANGUAGE_OPTIONS: Array<{
  description: string;
  label: string;
  value: QuestionLanguageMode;
}> = [
  {
    value: "ENGLISH",
    label: "English only",
    description: "Store only English content.",
  },
  {
    value: "MARATHI",
    label: "Marathi only",
    description: "Store only Marathi content.",
  },
  {
    value: "BILINGUAL",
    label: "English + Marathi",
    description: "Store both language variants together.",
  },
];

function joinClasses(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const EMPTY_FORM: QuestionFormState = {
  acceptedAnswers: "",
  code: "",
  correctOptionKeys: [],
  difficulty: "MEDIUM",
  explanationEnHtml: "",
  explanationImageAssetId: "",
  explanationMrHtml: "",
  languageMode: "MARATHI",
  mediumId: "",
  options: QUESTION_OPTION_KEYS.map((key) => ({
    englishHtml: "",
    imageAssetId: "",
    key,
    marathiHtml: "",
  })),
  statementEnHtml: "",
  statementImageAssetId: "",
  statementMrHtml: "",
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
  return htmlToPlainText(readStructuredDocumentHtml(value));
}

function readStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function hasMeaningfulHtml(value: string) {
  return htmlToPlainText(value).trim().length > 0;
}

function buildLocalizedDocument(input: {
  englishHtml: string;
  languageMode: QuestionLanguageMode;
  marathiHtml: string;
}) {
  const englishDocument =
    input.languageMode === "MARATHI"
      ? null
      : buildStructuredDocumentFromHtml(input.englishHtml);
  const marathiDocument =
    input.languageMode === "ENGLISH"
      ? null
      : buildStructuredDocumentFromHtml(input.marathiHtml);

  if (englishDocument && marathiDocument) {
    return {
      "en-IN": englishDocument,
      "mr-IN": marathiDocument,
    };
  }

  if (marathiDocument) {
    return {
      "mr-IN": marathiDocument,
    };
  }

  if (englishDocument) {
    return {
      "en-IN": englishDocument,
    };
  }

  return null;
}

function findMediaAssetId(
  question: QuestionDetail,
  usage: "EXPLANATION" | "OPTION" | "STATEMENT",
  optionKey?: string,
) {
  return (
    question.mediaReferences.find((reference) => {
      if (reference.usage !== usage) {
        return false;
      }

      if (usage === "OPTION") {
        return reference.optionKey === optionKey;
      }

      return true;
    })?.fileAssetId ?? ""
  );
}

function detectLanguageMode(question: QuestionDetail): QuestionLanguageMode {
  const metadataMode =
    isRecord(question.metadataJson) && typeof question.metadataJson.languageMode === "string"
      ? question.metadataJson.languageMode
      : null;

  if (
    metadataMode === "ENGLISH" ||
    metadataMode === "MARATHI" ||
    metadataMode === "BILINGUAL"
  ) {
    return metadataMode;
  }

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

  return {
    acceptedAnswers: readStringArray(correctAnswerJson.acceptedAnswers).join("\n"),
    code: readStringValue(question.code),
    correctOptionKeys: readStringArray(correctAnswerJson.optionKeys),
    difficulty: question.difficulty,
    explanationEnHtml: readStructuredDocumentHtml(
      getCandidateNode(question.explanationJson, "en"),
    ),
    explanationImageAssetId: findMediaAssetId(question, "EXPLANATION"),
    explanationMrHtml: readStructuredDocumentHtml(
      getCandidateNode(question.explanationJson, "mr"),
    ),
    languageMode: mode,
    mediumId: readStringValue(question.mediumId),
    options: QUESTION_OPTION_KEYS.map((key) => {
      const option = question.options.find((entry) => entry.optionKey === key);
      return {
        englishHtml: option
          ? readStructuredDocumentHtml(getCandidateNode(option.contentJson, "en"))
          : "",
        imageAssetId: findMediaAssetId(question, "OPTION", key),
        key,
        marathiHtml: option
          ? readStructuredDocumentHtml(getCandidateNode(option.contentJson, "mr"))
          : "",
      };
    }),
    statementEnHtml: readStructuredDocumentHtml(getCandidateNode(question.statementJson, "en")),
    statementImageAssetId: findMediaAssetId(question, "STATEMENT"),
    statementMrHtml: readStructuredDocumentHtml(getCandidateNode(question.statementJson, "mr")),
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
    if (option.imageAssetId.trim()) {
      return true;
    }

    if (form.languageMode === "MARATHI") {
      return hasMeaningfulHtml(option.marathiHtml);
    }

    if (form.languageMode === "BILINGUAL") {
      return hasMeaningfulHtml(option.englishHtml) || hasMeaningfulHtml(option.marathiHtml);
    }

    return hasMeaningfulHtml(option.englishHtml);
  }).length;
}

function canSaveQuestion(form: QuestionFormState) {
  const hasStatement =
    (form.languageMode !== "MARATHI" && hasMeaningfulHtml(form.statementEnHtml)) ||
    (form.languageMode !== "ENGLISH" && hasMeaningfulHtml(form.statementMrHtml));

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

function buildQuestionMediaReferences(form: QuestionFormState) {
  const mediaReferences: Array<{
    fileAssetId: string;
    optionKey?: string;
    orderIndex: number;
    usage: "EXPLANATION" | "OPTION" | "STATEMENT";
  }> = [];

  if (form.statementImageAssetId.trim()) {
    mediaReferences.push({
      fileAssetId: form.statementImageAssetId.trim(),
      orderIndex: 10,
      usage: "STATEMENT",
    });
  }

  form.options.forEach((option, index) => {
    if (!option.imageAssetId.trim()) {
      return;
    }

    mediaReferences.push({
      fileAssetId: option.imageAssetId.trim(),
      optionKey: option.key,
      orderIndex: (index + 1) * 10,
      usage: "OPTION",
    });
  });

  if (form.explanationImageAssetId.trim()) {
    mediaReferences.push({
      fileAssetId: form.explanationImageAssetId.trim(),
      orderIndex: 10,
      usage: "EXPLANATION",
    });
  }

  return mediaReferences;
}

function buildQuestionPayload(form: QuestionFormState): CreateQuestionInput | UpdateQuestionInput {
  const statementJson = buildLocalizedDocument({
    englishHtml: form.statementEnHtml,
    languageMode: form.languageMode,
    marathiHtml: form.statementMrHtml,
  }) as Record<string, unknown> | null;

  const explanationJson = buildLocalizedDocument({
    englishHtml: form.explanationEnHtml,
    languageMode: form.languageMode,
    marathiHtml: form.explanationMrHtml,
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
    mediaReferences: buildQuestionMediaReferences(form),
    mediumId: form.mediumId || undefined,
    metadataJson: {
      languageMode: form.languageMode,
      questionEditor: "admin-rich-html-v1",
    } as Record<string, unknown>,
    statementJson: statementJson ?? {},
    subjectId: form.subjectId,
    topicId: form.topicId || undefined,
    type: form.type,
    ...(form.type === "TEXT_INPUT"
      ? {}
      : {
          options: form.options
            .flatMap((option, index) => {
              const contentJson =
                buildLocalizedDocument({
                  englishHtml: option.englishHtml,
                  languageMode: form.languageMode,
                  marathiHtml: option.marathiHtml,
                }) ?? {};

              const shouldKeep =
                option.imageAssetId.trim().length > 0 ||
                Object.keys(contentJson).length > 0 ||
                form.correctOptionKeys.includes(option.key);

              if (!shouldKeep) {
                return [];
              }

              return [
                {
                  contentJson: contentJson as Record<string, unknown>,
                  optionKey: option.key,
                  orderIndex: (index + 1) * 10,
                },
              ];
            }),
        }),
  };

  return payload as unknown as CreateQuestionInput | UpdateQuestionInput;
}

function buildPreviewOptionDocument(option: QuestionOptionState, form: QuestionFormState) {
  return buildLocalizedDocument({
    englishHtml: option.englishHtml,
    languageMode: form.languageMode,
    marathiHtml: option.marathiHtml,
  });
}

function QuestionPreviewContent({
  className,
  content,
  emptyText,
  languageMode,
}: Readonly<{
  className?: string;
  content: unknown;
  emptyText: string;
  languageMode: QuestionLanguageMode;
}>) {
  const previewItems =
    languageMode === "BILINGUAL"
      ? [
          {
            className: undefined,
            label: "English",
            localeKeys: ["en-IN", "en"],
          },
          {
            className: "font-marathi-unicode",
            label: "Marathi",
            localeKeys: ["mr-IN", "mr"],
          },
        ].filter((item) => hasQuestionRichContent(content, item.localeKeys))
      : [
          {
            className:
              languageMode === "MARATHI" ? "font-marathi-unicode" : undefined,
            label: null,
            localeKeys:
              languageMode === "MARATHI"
                ? ["mr-IN", "mr"]
                : ["en-IN", "en"],
          },
        ].filter((item) => hasQuestionRichContent(content, item.localeKeys));

  if (previewItems.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--muted)]">{emptyText}</p>
    );
  }

  return (
    <div className={joinClasses("space-y-4", className)}>
      {previewItems.map((item) => (
        <div key={item.label ?? item.localeKeys.join("-")} className="space-y-2">
          {item.label ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {item.label}
            </p>
          ) : null}
          <QuestionRichTextRenderer
            className={item.className}
            html={extractQuestionHtml(content, item.localeKeys)}
          />
        </div>
      ))}
    </div>
  );
}

function QuestionLanguageSection({
  disabled,
  form,
  languageKey,
  onExplanationChange,
  onOptionChange,
  onStatementChange,
}: Readonly<{
  disabled: boolean;
  form: QuestionFormState;
  languageKey: "en" | "mr";
  onExplanationChange: (value: string) => void;
  onOptionChange: (optionKey: string, value: string) => void;
  onStatementChange: (value: string) => void;
}>) {
  const label = languageKey === "mr" ? "Marathi" : "English";
  const statementValue = languageKey === "mr" ? form.statementMrHtml : form.statementEnHtml;
  const explanationValue =
    languageKey === "mr" ? form.explanationMrHtml : form.explanationEnHtml;
  const hint =
    languageKey === "mr"
      ? "Marathi editor supports Unicode, Shree-Dev, and Surekh together. Choose the typing font before entering or pasting content."
      : "Use the toolbar to format text, add tables, and insert equations.";

  return (
    <section className="tc-card rounded-[28px] p-6">
      <div className="flex items-center justify-between border-b border-[rgba(0,30,64,0.08)] pb-4">
        <div>
          <p className="tc-overline">Question content</p>
          <h2 className="mt-2 text-xl font-semibold text-[color:var(--brand)]">{label}</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-6">
        <AdminQuestionRichTextField
          disabled={disabled}
          hint={hint}
          language={languageKey}
          label={`Statement (${label})`}
          minHeight="14rem"
          onChange={onStatementChange}
          showPreview={false}
          value={statementValue}
        />

        {form.type !== "TEXT_INPUT" ? (
          <div className="grid gap-4">
            <div>
              <h3 className="text-base font-semibold text-[color:var(--brand)]">
                Options ({label})
              </h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Add option text, tables, equations, and shared option images.
              </p>
            </div>

            {form.options.map((option) => (
              <div
                key={`${languageKey}-${option.key}`}
                className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="tc-code-chip">Option {option.key}</span>
                </div>
                <AdminQuestionRichTextField
                  disabled={disabled}
                  hint={hint}
                  language={languageKey}
                  label={`Option ${option.key} (${label})`}
                  minHeight="9rem"
                  onChange={(value) => onOptionChange(option.key, value)}
                  showPreview={false}
                  value={languageKey === "mr" ? option.marathiHtml : option.englishHtml}
                />
              </div>
            ))}
          </div>
        ) : null}

        <AdminQuestionRichTextField
          disabled={disabled}
          hint="Optional explanation shown after answer submission."
          language={languageKey}
          label={`Explanation (${label})`}
          minHeight="10rem"
          onChange={onExplanationChange}
          showPreview={false}
          value={explanationValue}
        />
      </div>
    </section>
  );
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

  if ((!canReadQuestions && isEdit) || (!canManageQuestions && !isEdit)) {
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
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDetail | null>(question);
  const [form, setForm] = useState<QuestionFormState>(() =>
    buildInitialQuestionForm(question, taxonomy.subjects[0]?.id ?? ""),
  );
  const [message, setMessage] = useState<string | null>(null);

  const selectedSubjectTopics = useMemo(
    () => (form.subjectId ? taxonomy.topicsBySubjectId[form.subjectId] ?? [] : []),
    [form.subjectId, taxonomy.topicsBySubjectId],
  );

  const visibleLanguages = useMemo(() => {
    if (form.languageMode === "BILINGUAL") {
      return ["en", "mr"] as const;
    }

    return [form.languageMode === "MARATHI" ? "mr" : "en"] as const;
  }, [form.languageMode]);

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (mode: "draft" | "publish", accessToken: string) => {
      const payload = buildQuestionPayload(form);
      const savedQuestion =
        isEdit && questionId
          ? await updateAdminQuestion(questionId, payload as UpdateQuestionInput, accessToken)
          : await createAdminQuestion(payload as CreateQuestionInput, accessToken);

      if (mode === "publish") {
        return publishAdminQuestion(savedQuestion.id, accessToken);
      }

      return savedQuestion;
    },
    onSuccess: async (savedQuestion, mode) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "questions"],
      });

      if (!isEdit) {
        router.replace(`/admin/questions/${savedQuestion.id}`);
        return;
      }

      setMessage(mode === "publish" ? "Question saved and published." : "Question saved.");
      setCurrentQuestion(savedQuestion);
      setForm(buildFormState(savedQuestion));
      await queryClient.invalidateQueries({
        queryKey: ["admin", "question", savedQuestion.id],
      });
    },
  });

  const statusMutation = useAuthenticatedMutation({
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
    englishHtml: form.statementEnHtml,
    languageMode: form.languageMode,
    marathiHtml: form.statementMrHtml,
  });
  const explanationPreview = buildLocalizedDocument({
    englishHtml: form.explanationEnHtml,
    languageMode: form.languageMode,
    marathiHtml: form.explanationMrHtml,
  });
  const isBusy = saveMutation.isPending || statusMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Assessment management"
        title={isEdit ? "Edit question" : "Create question"}
        description="Compose multilingual question content, attach shared images, review the rendered payload, and publish when the record is ready for practice and tests."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/questions" className="tc-button-secondary">
              Back to question bank
            </Link>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() =>
                previewSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              Preview question
            </button>
            {isEdit && currentQuestion?.status === "PUBLISHED" ? (
              <button
                type="button"
                className="tc-button-secondary"
                disabled={!canPublishQuestions || isBusy}
                onClick={() => {
                  setMessage(null);
                  statusMutation.mutate("unpublish");
                }}
              >
                Move to draft
              </button>
            ) : null}
            <button
              type="button"
              className="tc-button-secondary"
              disabled={!canManageQuestions || !canSaveQuestion(form) || isBusy}
              onClick={() => {
                setMessage(null);
                saveMutation.mutate("draft");
              }}
            >
              {saveMutation.isPending ? "Saving..." : isEdit ? "Save question" : "Create question"}
            </button>
            <button
              type="button"
              className="tc-button-primary"
              disabled={
                !canManageQuestions ||
                !canPublishQuestions ||
                !canSaveQuestion(form) ||
                isBusy
              }
              onClick={() => {
                setMessage(null);
                saveMutation.mutate("publish");
              }}
            >
              {saveMutation.isPending
                ? "Saving..."
                : currentQuestion?.status === "PUBLISHED"
                  ? "Save & keep published"
                  : "Save & publish"}
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

      {statusMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            statusMutation.error,
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
            <p className="tc-overline">Media</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
              {currentQuestion.hasMedia ? "Attached" : "Text only"}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6">
          {visibleLanguages.map((languageKey) => (
            <QuestionLanguageSection
              disabled={!canManageQuestions || isBusy}
              key={languageKey}
              form={form}
              languageKey={languageKey}
              onExplanationChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ...(languageKey === "mr"
                    ? { explanationMrHtml: value }
                    : { explanationEnHtml: value }),
                }))
              }
              onOptionChange={(optionKey, value) =>
                setForm((current) => ({
                  ...current,
                  options: current.options.map((option) =>
                    option.key === optionKey
                      ? {
                          ...option,
                          ...(languageKey === "mr"
                            ? { marathiHtml: value }
                            : { englishHtml: value }),
                        }
                      : option,
                  ),
                }))
              }
              onStatementChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ...(languageKey === "mr"
                    ? { statementMrHtml: value }
                    : { statementEnHtml: value }),
                }))
              }
            />
          ))}

          {form.type === "TEXT_INPUT" ? (
            <section className="tc-card rounded-[28px] p-6">
              <h2 className="text-xl font-semibold text-[color:var(--brand)]">Accepted answers</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Add one accepted answer per line. The student answer will be checked against this
                list.
              </p>
              <textarea
                className="tc-input mt-5 min-h-36 resize-y"
                disabled={!canManageQuestions || isBusy}
                placeholder={"Delhi\nNew Delhi"}
                value={form.acceptedAnswers}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    acceptedAnswers: event.target.value,
                  }))
                }
              />
            </section>
          ) : (
            <section className="tc-card rounded-[28px] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[color:var(--brand)]">Correct answer</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {form.type === "MULTIPLE_CHOICE"
                      ? "Select every correct option."
                      : "Select the single correct option."}
                  </p>
                </div>
                <span className="tc-code-chip">
                  {form.correctOptionKeys.length > 0
                    ? `Selected: ${form.correctOptionKeys.join(", ")}`
                    : "No option selected"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {form.options.map((option) => {
                  const isSelected = form.correctOptionKeys.includes(option.key);
                  return (
                    <button
                      key={`correct-${option.key}`}
                      type="button"
                      className={[
                        "rounded-[22px] border px-4 py-4 text-left transition",
                        isSelected
                          ? "border-[rgba(0,51,102,0.28)] bg-[rgba(0,51,102,0.06)]"
                          : "border-[rgba(0,30,64,0.08)] bg-white/78 hover:border-[rgba(0,51,102,0.2)]",
                      ].join(" ")}
                      disabled={!canManageQuestions || isBusy}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          correctOptionKeys:
                            current.type === "MULTIPLE_CHOICE"
                              ? isSelected
                                ? current.correctOptionKeys.filter((key) => key !== option.key)
                                : [...current.correctOptionKeys, option.key].sort()
                              : [option.key],
                        }))
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="tc-code-chip">{option.key}</span>
                        <span className="font-semibold text-[color:var(--brand)]">
                          {isSelected ? "Marked correct" : "Mark as correct"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="tc-card rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--brand)]">Shared images</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Upload shared media once. The same image is reused across the active language
              variants.
            </p>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <AdminQuestionMediaField
                description="Upload once. The same statement image is used for all language variants."
                emptyDescription="No statement image is linked yet."
                label="Statement image"
                value={form.statementImageAssetId}
                onChange={(assetId) =>
                  setForm((current) => ({ ...current, statementImageAssetId: assetId }))
                }
              />
              <AdminQuestionMediaField
                description="Optional explanation image shared across the active language variants."
                emptyDescription="No explanation image is linked yet."
                label="Explanation image"
                value={form.explanationImageAssetId}
                onChange={(assetId) =>
                  setForm((current) => ({ ...current, explanationImageAssetId: assetId }))
                }
              />
            </div>

            {form.type !== "TEXT_INPUT" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {form.options.map((option) => (
                  <AdminQuestionMediaField
                    key={`option-image-${option.key}`}
                    description={`Shared option ${option.key} image across the active language variants.`}
                    emptyDescription={`No image is linked for option ${option.key} yet.`}
                    label={`Option ${option.key} image`}
                    value={option.imageAssetId}
                    onChange={(assetId) =>
                      setForm((current) => ({
                        ...current,
                        options: current.options.map((entry) =>
                          entry.key === option.key
                            ? { ...entry, imageAssetId: assetId }
                            : entry,
                        ),
                      }))
                    }
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section ref={previewSectionRef} className="tc-card rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--brand)]">Preview</h2>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-5">
                <p className="tc-overline">Statement</p>
                <div className="mt-3">
                  <QuestionPreviewContent
                    content={statementPreview}
                    emptyText="Add a statement to preview it."
                    languageMode={form.languageMode}
                  />
                </div>

                {form.statementImageAssetId ? (
                  <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                    A shared statement image is linked and will render with this question.
                  </p>
                ) : null}

                {form.type !== "TEXT_INPUT" ? (
                  <div className="mt-5 grid gap-3">
                    {form.options.map((option) => {
                      const previewDocument = buildPreviewOptionDocument(option, form);
                      const hasOptionBody = Boolean(
                        previewDocument && Object.keys(previewDocument).length > 0,
                      );

                      if (!hasOptionBody && !option.imageAssetId) {
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
                          {hasOptionBody ? (
                            <div className="mt-3">
                              <QuestionPreviewContent
                                content={previewDocument}
                                emptyText="Add option content to preview it."
                                languageMode={form.languageMode}
                              />
                            </div>
                          ) : null}
                          {option.imageAssetId ? (
                            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                              A shared option image is linked for this answer choice.
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-5">
                <p className="tc-overline">Explanation</p>
                <div className="mt-3">
                  <QuestionPreviewContent
                    content={explanationPreview}
                    emptyText="Add an explanation if you want one."
                    languageMode={form.languageMode}
                  />
                </div>
                {form.explanationImageAssetId ? (
                  <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                    A shared explanation image is linked and will render in review mode.
                  </p>
                ) : null}
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

        <aside className="grid gap-6">
          <section className="tc-card rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--brand)]">Question settings</h2>
            <div className="mt-5 grid gap-4">
              <AdminInput
                disabled={!canManageQuestions || isBusy}
                label="Code"
                placeholder="polity-fr-001"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
              <AdminSelect
                disabled={!canManageQuestions || isBusy}
                label="Question type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    acceptedAnswers: "",
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
                disabled={!canManageQuestions || isBusy}
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
                disabled={!canManageQuestions || isBusy}
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
                disabled={!canManageQuestions || isBusy}
                label="Topic"
                value={form.topicId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, topicId: event.target.value }))
                }
              >
                <option value="">Optional topic</option>
                {selectedSubjectTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                disabled={!canManageQuestions || isBusy}
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
            </div>
          </section>

          <section className="tc-card rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--brand)]">Question languages</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Choose whether the admin enters English, Marathi, or both.
            </p>
            <div className="mt-5 grid gap-3">
              {QUESTION_LANGUAGE_OPTIONS.map((option) => {
                const isActive = form.languageMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={[
                      "rounded-[22px] border px-4 py-4 text-left transition",
                      isActive
                        ? "border-[rgba(0,51,102,0.28)] bg-[rgba(0,51,102,0.06)]"
                        : "border-[rgba(0,30,64,0.08)] bg-white/78 hover:border-[rgba(0,51,102,0.2)]",
                    ].join(" ")}
                    disabled={!canManageQuestions || isBusy}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        languageMode: option.value,
                      }))
                    }
                  >
                    <p className="font-semibold text-[color:var(--brand)]">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
