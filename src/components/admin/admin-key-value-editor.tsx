"use client"

import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field"

type AdminKeyValueType = "text" | "number" | "boolean" | "list"

export interface AdminKeyValueRow {
  id: string
  key: string
  type: AdminKeyValueType
  value: string
}

function createRow(partial?: Partial<AdminKeyValueRow>): AdminKeyValueRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `row-${Math.random().toString(36).slice(2, 10)}`,
    key: "",
    type: "text",
    value: "",
    ...partial,
  }
}

function inferRowType(value: unknown): AdminKeyValueType {
  if (typeof value === "number") {
    return "number"
  }

  if (typeof value === "boolean") {
    return "boolean"
  }

  if (Array.isArray(value)) {
    return "list"
  }

  return "text"
}

function stringifyRowValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter(
        (entry): entry is string | number | boolean =>
          typeof entry === "string" ||
          typeof entry === "number" ||
          typeof entry === "boolean",
      )
      .map((entry) => String(entry))
      .join(", ")
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  if (typeof value === "number") {
    return String(value)
  }

  return typeof value === "string" ? value : ""
}

export function parseKeyValueObject(
  value: Record<string, unknown> | null | undefined,
) {
  return Object.entries(value ?? {}).map(([key, entry]) =>
    createRow({
      key,
      type: inferRowType(entry),
      value: stringifyRowValue(entry),
    }),
  )
}

export function serializeKeyValueRows(rows: AdminKeyValueRow[]) {
  const nextValue: Record<string, unknown> = {}

  for (const row of rows) {
    const key = row.key.trim()
    if (!key) {
      continue
    }

    if (row.type === "number") {
      const parsed = Number(row.value)
      if (Number.isFinite(parsed)) {
        nextValue[key] = parsed
      }
      continue
    }

    if (row.type === "boolean") {
      nextValue[key] = row.value.trim().toLowerCase() === "true"
      continue
    }

    if (row.type === "list") {
      nextValue[key] = row.value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
      continue
    }

    const normalized = row.value.trim()
    if (normalized) {
      nextValue[key] = normalized
    }
  }

  return Object.keys(nextValue).length > 0 ? nextValue : undefined
}

export function AdminKeyValueEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminKeyValueRow[]) => void
  rows: AdminKeyValueRow[]
}>) {
  function updateRows(nextRows: AdminKeyValueRow[]) {
    onChange(nextRows)
  }

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
            No fields added yet.
          </div>
        ) : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
              <AdminInput
                label={`Field ${index + 1}`}
                disabled={disabled}
                value={row.key}
                onChange={(event) =>
                  updateRows(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            key: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminSelect
                label="Type"
                disabled={disabled}
                value={row.type}
                onChange={(event) =>
                  updateRows(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            type: event.target.value as AdminKeyValueType,
                          }
                        : current,
                    ),
                  )
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="list">Comma list</option>
              </AdminSelect>
            </div>

            <AdminInput
              label="Value"
              disabled={disabled}
              value={row.value}
              onChange={(event) =>
                updateRows(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          value: event.target.value,
                        }
                      : current,
                  ),
                )
              }
            />

            <div className="flex justify-end">
              <button
                type="button"
                className="tc-button-secondary"
                disabled={disabled}
                onClick={() =>
                  updateRows(rows.filter((current) => current.id !== row.id))
                }
              >
                Remove row
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => updateRows([...rows, createRow()])}
          >
            Add field
          </button>
        </div>
      </div>
    </div>
  )
}
