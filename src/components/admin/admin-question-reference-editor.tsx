"use client"

import { useState, type ReactNode } from "react"
import { AdminInput } from "@/components/admin/admin-form-field"

const QUESTION_PICKER_PAGE_SIZE = 10

export interface AdminQuestionReferenceRow {
  code?: string | null
  difficulty?: string | null
  id: string
  negativeMarks: string
  orderIndex: string
  positiveMarks: string
  questionId: string
  statementPreviewText?: string | null
  status?: string | null
  subjectName?: string | null
  topicName?: string | null
  type?: string | null
}

export interface AdminQuestionReferenceOption {
  code?: string | null
  difficulty: string
  id: string
  statementPreviewText?: string | null
  status: string
  subjectName: string
  topicName?: string | null
  type: string
}

function createQuestionReferenceRow(
  partial?: Partial<AdminQuestionReferenceRow>,
): AdminQuestionReferenceRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `test-question-${Math.random().toString(36).slice(2, 10)}`,
    negativeMarks: "",
    orderIndex: "",
    positiveMarks: "",
    questionId: "",
    ...partial,
  }
}

export function buildQuestionReferenceRows(
  questions:
    | Array<{
        negativeMarks?: number | null
        orderIndex?: number | null
        positiveMarks?: number | null
        question?: {
          code?: unknown
          difficulty?: string | null
          statementPreviewText?: unknown
          status?: string | null
          subject?: { name?: string | null } | null
          topic?: { name?: string | null } | null
          type?: string | null
        } | null
        questionId: string
      }>
    | null
    | undefined,
) {
  return (questions ?? []).map((question) =>
    createQuestionReferenceRow({
      negativeMarks:
        typeof question.negativeMarks === "number"
          ? String(question.negativeMarks)
          : "",
      orderIndex:
        typeof question.orderIndex === "number" ? String(question.orderIndex) : "",
      positiveMarks:
        typeof question.positiveMarks === "number"
          ? String(question.positiveMarks)
          : "",
      code:
        typeof question.question?.code === "string" ? question.question.code : null,
      difficulty: question.question?.difficulty ?? null,
      statementPreviewText:
        typeof question.question?.statementPreviewText === "string"
          ? question.question.statementPreviewText
          : null,
      status: question.question?.status ?? null,
      subjectName: question.question?.subject?.name ?? null,
      topicName: question.question?.topic?.name ?? null,
      type: question.question?.type ?? null,
      questionId: question.questionId,
    }),
  )
}

export function serializeQuestionReferenceRows(
  rows: AdminQuestionReferenceRow[],
) {
  return rows
    .map((row) => {
      const questionId = row.questionId.trim()
      if (!questionId) {
        return null
      }

      const orderIndex = Number(row.orderIndex)
      const positiveMarks = Number(row.positiveMarks)
      const negativeMarks = Number(row.negativeMarks)

      return {
        negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : undefined,
        orderIndex: Number.isFinite(orderIndex) ? orderIndex : undefined,
        positiveMarks: Number.isFinite(positiveMarks) ? positiveMarks : undefined,
        questionId,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

function buildQuestionRowFromOption(
  option: AdminQuestionReferenceOption,
  orderIndex: number,
) {
  return createQuestionReferenceRow({
    code: option.code ?? null,
    difficulty: option.difficulty,
    negativeMarks: "0",
    orderIndex: String(orderIndex),
    positiveMarks: "1",
    questionId: option.id,
    statementPreviewText: option.statementPreviewText ?? null,
    status: option.status,
    subjectName: option.subjectName,
    topicName: option.topicName ?? null,
    type: option.type,
  })
}

function mergeQuestionRowSummary(
  row: AdminQuestionReferenceRow,
  option: AdminQuestionReferenceOption | undefined,
) {
  if (!option) {
    return row
  }

  return {
    ...row,
    code: option.code ?? row.code,
    difficulty: option.difficulty ?? row.difficulty,
    statementPreviewText: option.statementPreviewText ?? row.statementPreviewText,
    status: option.status ?? row.status,
    subjectName: option.subjectName ?? row.subjectName,
    topicName: option.topicName ?? row.topicName,
    type: option.type ?? row.type,
  }
}

function getQuestionLabel(row: AdminQuestionReferenceRow) {
  return row.statementPreviewText?.trim() || row.code?.trim() || row.questionId
}

export function AdminQuestionReferenceEditor({
  disabled,
  hint,
  label,
  onChange,
  pickerControls,
  questionOptions = [],
  questionOptionsLoading = false,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminQuestionReferenceRow[]) => void
  pickerControls?: ReactNode
  questionOptions?: AdminQuestionReferenceOption[]
  questionOptionsLoading?: boolean
  rows: AdminQuestionReferenceRow[]
}>) {
  const [pickerPage, setPickerPage] = useState(1)
  const selectedIds = new Set(rows.map((row) => row.questionId).filter(Boolean))
  const questionOptionsById = new Map(
    questionOptions.map((option) => [option.id, option]),
  )
  const totalPickerPages = Math.max(
    1,
    Math.ceil(questionOptions.length / QUESTION_PICKER_PAGE_SIZE),
  )
  const safePickerPage = Math.min(Math.max(pickerPage, 1), totalPickerPages)
  const pickerSliceStart = (safePickerPage - 1) * QUESTION_PICKER_PAGE_SIZE
  const paginatedQuestionOptions = questionOptions.slice(
    pickerSliceStart,
    pickerSliceStart + QUESTION_PICKER_PAGE_SIZE,
  )
  const pickerStartItem =
    questionOptions.length === 0
      ? 0
      : (safePickerPage - 1) * QUESTION_PICKER_PAGE_SIZE + 1
  const pickerEndItem = Math.min(
    safePickerPage * QUESTION_PICKER_PAGE_SIZE,
    questionOptions.length,
  )

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-1">
        <span className="tc-form-label">{label}</span>
        {hint ? (
          <span className="text-xs leading-5 text-[color:var(--muted)]">
            {hint}
          </span>
        ) : null}
      </div>

      {pickerControls || questionOptions.length > 0 || questionOptionsLoading ? (
        <div className="grid gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/72 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[color:var(--brand)]">
              Question bank
            </span>
            <span className="text-xs leading-5 text-[color:var(--muted)]">
              {rows.length} selected
            </span>
          </div>
          {pickerControls ? (
            <div className="grid gap-3 md:grid-cols-4">{pickerControls}</div>
          ) : null}
          <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
            {questionOptionsLoading ? (
              <div className="rounded-[16px] border border-dashed border-[rgba(0,30,64,0.12)] bg-white/68 p-4 text-sm text-[color:var(--muted)]">
                Loading questions...
              </div>
            ) : null}
            {!questionOptionsLoading && questionOptions.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[rgba(0,30,64,0.12)] bg-white/68 p-4 text-sm text-[color:var(--muted)]">
                No questions matched these filters.
              </div>
            ) : null}
            {paginatedQuestionOptions.map((option) => {
              const isSelected = selectedIds.has(option.id)

              return (
                <div
                  key={option.id}
                  className="grid gap-3 rounded-[16px] border border-[rgba(0,30,64,0.08)] bg-white/82 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--brand)]">
                      {option.statementPreviewText || option.code || option.id}
                    </p>
                    <p className="mt-1 truncate text-xs text-[color:var(--muted)]">
                      {(option.code ?? option.id)} · {option.subjectName}
                      {option.topicName ? ` · ${option.topicName}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                      {option.type.replaceAll("_", " ")} · {option.difficulty} ·{" "}
                      {option.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="tc-button-secondary self-center"
                    disabled={disabled || isSelected}
                    onClick={() =>
                      onChange([
                        ...rows,
                        buildQuestionRowFromOption(option, rows.length + 1),
                      ])
                    }
                  >
                    {isSelected ? "Added" : "Add"}
                  </button>
                </div>
              )
            })}
          </div>
          {questionOptions.length > QUESTION_PICKER_PAGE_SIZE ? (
            <div className="flex flex-col gap-3 border-t border-[rgba(0,30,64,0.08)] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-[color:var(--muted)]">
                Showing {pickerStartItem}-{pickerEndItem} of{" "}
                {questionOptions.length}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={safePickerPage <= 1}
                  onClick={() => setPickerPage(safePickerPage - 1)}
                >
                  Previous
                </button>
                <span className="tc-code-chip">
                  Page {safePickerPage} / {totalPickerPages}
                </span>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={safePickerPage >= totalPickerPages}
                  onClick={() => setPickerPage(safePickerPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[rgba(0,30,64,0.14)] bg-white/68 p-4 text-sm leading-6 text-[color:var(--muted)]">
            No questions added yet.
          </div>
        ) : null}

        {rows.map((sourceRow, index) => {
          const row = mergeQuestionRowSummary(
            sourceRow,
            questionOptionsById.get(sourceRow.questionId),
          )

          return (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--brand)]">
                {index + 1}. {getQuestionLabel(row)}
              </p>
              <p className="mt-1 truncate text-xs text-[color:var(--muted)]">
                {(row.code ?? row.questionId) || "Question ID required"}
                {row.subjectName ? ` · ${row.subjectName}` : ""}
                {row.topicName ? ` · ${row.topicName}` : ""}
              </p>
            </div>
            <AdminInput
              label={`Question ${index + 1} ID`}
              disabled={disabled}
              value={row.questionId}
              onChange={(event) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          questionId: event.target.value,
                        }
                      : current,
                  ),
                )
              }
            />

            <div className="grid gap-3 md:grid-cols-3">
              <AdminInput
                label="Order"
                disabled={disabled}
                type="number"
                value={row.orderIndex}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            orderIndex: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminInput
                label="Positive marks"
                disabled={disabled}
                type="number"
                value={row.positiveMarks}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            positiveMarks: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminInput
                label="Negative marks"
                disabled={disabled}
                type="number"
                value={row.negativeMarks}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            negativeMarks: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="tc-button-secondary"
                disabled={disabled || index === 0}
                onClick={() => {
                  const nextRows = [...rows]
                  const previous = nextRows[index - 1]
                  nextRows[index - 1] = nextRows[index]
                  nextRows[index] = previous
                  onChange(
                    nextRows.map((current, nextIndex) => ({
                      ...current,
                      orderIndex: String(nextIndex + 1),
                    })),
                  )
                }}
              >
                Move up
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                disabled={disabled || index === rows.length - 1}
                onClick={() => {
                  const nextRows = [...rows]
                  const next = nextRows[index + 1]
                  nextRows[index + 1] = nextRows[index]
                  nextRows[index] = next
                  onChange(
                    nextRows.map((current, nextIndex) => ({
                      ...current,
                      orderIndex: String(nextIndex + 1),
                    })),
                  )
                }}
              >
                Move down
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                disabled={disabled}
                onClick={() =>
                  onChange(rows.filter((current) => current.id !== row.id))
                }
              >
                Remove question
              </button>
            </div>
          </div>
          )
        })}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createQuestionReferenceRow()])}
          >
            Add question
          </button>
        </div>
      </div>
    </div>
  )
}
