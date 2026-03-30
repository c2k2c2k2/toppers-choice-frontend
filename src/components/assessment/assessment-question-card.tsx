"use client";

import type { ReactNode } from "react";
import { AssetImage } from "@/components/primitives/asset-image";
import { QuestionLocalizedRichTextRenderer } from "@/components/questions/question-rich-text-renderer";
import {
  buildEmptyAssessmentDraft,
  getAssessmentPreferredLocaleKeys,
  getAssessmentQuestionMediaReferences,
  type AssessmentAnswerDraft,
  type AssessmentQuestion,
} from "@/lib/assessment";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function buildNextChoiceDraft(input: {
  currentDraft: AssessmentAnswerDraft;
  optionKey: string;
  questionType: AssessmentQuestion["type"];
}) {
  const currentOptionKeys = input.currentDraft.optionKeys ?? [];

  if (input.questionType === "SINGLE_CHOICE") {
    return {
      optionKeys: [input.optionKey],
    } satisfies AssessmentAnswerDraft;
  }

  const nextOptionKeys = currentOptionKeys.includes(input.optionKey)
    ? currentOptionKeys.filter((item) => item !== input.optionKey)
    : [...currentOptionKeys, input.optionKey].sort((left, right) =>
        left.localeCompare(right),
      );

  return {
    optionKeys: nextOptionKeys,
  } satisfies AssessmentAnswerDraft;
}

function renderToneClasses(tone: "danger" | "idle" | "success" | "warning") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[rgba(0,30,64,0.08)] bg-white/70 text-[color:var(--muted)]";
}

export function AssessmentQuestionCard({
  answerDraft,
  footer,
  onAnswerChange,
  preferredLocaleKeys,
  question,
  questionNumber,
  readOnly = false,
  status,
}: Readonly<{
  answerDraft: AssessmentAnswerDraft;
  footer?: ReactNode;
  onAnswerChange?: (draft: AssessmentAnswerDraft) => void;
  preferredLocaleKeys?: string[];
  question: AssessmentQuestion;
  questionNumber: number;
  readOnly?: boolean;
  status?: {
    label: string;
    tone: "danger" | "idle" | "success" | "warning";
  };
}>) {
  const localeKeys =
    preferredLocaleKeys ?? getAssessmentPreferredLocaleKeys(question.medium?.name);
  const draft =
    answerDraft.optionKeys || answerDraft.text !== undefined
      ? answerDraft
      : buildEmptyAssessmentDraft(question.type);
  const selectedOptionKeys = draft.optionKeys ?? [];
  const statementMedia = getAssessmentQuestionMediaReferences(question, {
    usage: "STATEMENT",
  });

  return (
    <article className="tc-student-panel rounded-[28px] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Question {questionNumber}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="tc-code-chip">{question.type.replaceAll("_", " ")}</span>
            <span className="tc-code-chip">{question.difficulty}</span>
            <span className="tc-code-chip">{question.subject.name}</span>
            {question.topic ? (
              <span className="tc-code-chip">{question.topic.name}</span>
            ) : null}
          </div>
        </div>

        {status ? (
          <span
            className={joinClasses(
              "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold",
              renderToneClasses(status.tone),
            )}
          >
            {status.label}
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        <QuestionLocalizedRichTextRenderer
          content={question.statementJson}
          preferredLocaleKeys={localeKeys}
        />

        {statementMedia.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {statementMedia.map((reference) => (
              <AssetImage
                key={reference.id}
                alt={`Question ${questionNumber} statement media`}
                asset={reference.fileAsset}
                className="max-h-72 w-full rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white object-contain"
              />
            ))}
          </div>
        ) : null}

        {question.type === "TEXT_INPUT" ? (
          <div className="tc-form-field">
            <label className="tc-form-label" htmlFor={`answer-${question.id}`}>
              Your answer
            </label>
            <textarea
              id={`answer-${question.id}`}
              className="tc-input min-h-32 resize-y"
              disabled={readOnly || !onAnswerChange}
              placeholder="Type the final answer here."
              value={draft.text ?? ""}
              onChange={(event) => {
                onAnswerChange?.({
                  text: event.target.value,
                });
              }}
            />
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="tc-form-label">
              {question.type === "MULTIPLE_CHOICE"
                ? "Select one or more options"
                : "Select one option"}
            </p>
            {question.options
              .slice()
              .sort((left, right) => left.orderIndex - right.orderIndex)
              .map((option) => {
                const isSelected = selectedOptionKeys.includes(option.optionKey);
                const optionMedia = getAssessmentQuestionMediaReferences(question, {
                  optionKey: option.optionKey,
                  usage: "OPTION",
                });

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={readOnly || !onAnswerChange}
                    onClick={() => {
                      onAnswerChange?.(
                        buildNextChoiceDraft({
                          currentDraft: draft,
                          optionKey: option.optionKey,
                          questionType: question.type,
                        }),
                      );
                    }}
                    className={joinClasses(
                      "flex min-h-[4.5rem] items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition duration-200",
                      readOnly || !onAnswerChange
                        ? "cursor-default"
                        : "hover:-translate-y-0.5",
                      isSelected
                        ? "border-[rgba(0,51,102,0.28)] bg-[rgba(0,51,102,0.06)]"
                        : "border-[rgba(0,30,64,0.08)] bg-white/78",
                    )}
                  >
                    <span
                      className={joinClasses(
                        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                        isSelected
                          ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white"
                          : "border-[rgba(0,30,64,0.14)] text-[color:var(--brand)]",
                      )}
                    >
                      {option.optionKey}
                    </span>
                    <div className="min-w-0 flex-1 text-[color:var(--brand)]">
                      <QuestionLocalizedRichTextRenderer
                        content={option.contentJson}
                        preferredLocaleKeys={localeKeys}
                      />
                      {optionMedia.length > 0 ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {optionMedia.map((reference) => (
                            <AssetImage
                              key={reference.id}
                              alt={`Option ${option.optionKey} media`}
                              asset={reference.fileAsset}
                              className="max-h-52 w-full rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white object-contain"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </article>
  );
}
