"use client"

import { AdminInput } from "@/components/admin/admin-form-field"

export interface AdminQuestionReferenceRow {
  id: string
  negativeMarks: string
  orderIndex: string
  positiveMarks: string
  questionId: string
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

export function AdminQuestionReferenceEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminQuestionReferenceRow[]) => void
  rows: AdminQuestionReferenceRow[]
}>) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-1">
        <span className="tc-form-label">{label}</span>
        {hint ? (
          <span className="text-xs leading-5 text-[color:var(--muted)]">
            {hint}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[rgba(0,30,64,0.14)] bg-white/68 p-4 text-sm leading-6 text-[color:var(--muted)]">
            No questions added yet.
          </div>
        ) : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
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

            <div className="flex justify-end">
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
        ))}

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
