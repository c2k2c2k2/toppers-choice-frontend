"use client"

import { AdminFontTextField } from "@/components/admin/admin-font-text-field"
import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field"

function createRowId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function renderEmptyState(message: string) {
  return (
    <div className="rounded-[20px] border border-dashed border-[rgba(0,30,64,0.14)] bg-white/68 p-4 text-sm leading-6 text-[color:var(--muted)]">
      {message}
    </div>
  )
}

interface EditorShellProps {
  children: React.ReactNode
  hint?: string
  label: string
}

function EditorShell({
  children,
  hint,
  label,
}: Readonly<EditorShellProps>) {
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
      {children}
    </div>
  )
}

export interface AdminCmsStatRow {
  id: string
  label: string
  value: string
}

function createStatRow(partial?: Partial<AdminCmsStatRow>): AdminCmsStatRow {
  return {
    id: createRowId("cms-stat"),
    label: "",
    value: "",
    ...partial,
  }
}

export function buildCmsStatRows(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null
          }

          return createStatRow({
            label: typeof entry.label === "string" ? entry.label : "",
            value: typeof entry.value === "string" ? entry.value : "",
          })
        })
        .filter((entry): entry is AdminCmsStatRow => Boolean(entry))
    : []
}

export function serializeCmsStatRows(rows: AdminCmsStatRow[]) {
  const items = rows
    .map((row) => {
      const label = row.label.trim()
      const value = row.value.trim()

      if (!label && !value) {
        return null
      }

      return {
        label: label || undefined,
        value: value || undefined,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  return items.length > 0 ? items : undefined
}

export function AdminCmsStatsEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminCmsStatRow[]) => void
  rows: AdminCmsStatRow[]
}>) {
  return (
    <EditorShell hint={hint} label={label}>
      <div className="grid gap-3">
        {rows.length === 0 ? renderEmptyState("No highlights added yet.") : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <AdminFontTextField
                disabled={disabled}
                label={`Highlight ${index + 1} label`}
                storage="html"
                value={row.label}
                onChange={(value) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            label: value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminFontTextField
                disabled={disabled}
                label="Value"
                storage="html"
                value={row.value}
                onChange={(value) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            value,
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
                Remove highlight
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createStatRow()])}
          >
            Add highlight
          </button>
        </div>
      </div>
    </EditorShell>
  )
}

export interface AdminCmsFeedItemRow {
  description: string
  href: string
  id: string
  label: string
  meta: string
  title: string
}

function createFeedItemRow(
  partial?: Partial<AdminCmsFeedItemRow>,
): AdminCmsFeedItemRow {
  return {
    description: "",
    href: "",
    id: createRowId("cms-feed"),
    label: "",
    meta: "",
    title: "",
    ...partial,
  }
}

export function buildCmsFeedItemRows(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null
          }

          return createFeedItemRow({
            description:
              typeof entry.description === "string" ? entry.description : "",
            href: typeof entry.href === "string" ? entry.href : "",
            label: typeof entry.label === "string" ? entry.label : "",
            meta: typeof entry.meta === "string" ? entry.meta : "",
            title: typeof entry.title === "string" ? entry.title : "",
          })
        })
        .filter((entry): entry is AdminCmsFeedItemRow => Boolean(entry))
    : []
}

export function serializeCmsFeedItemRows(rows: AdminCmsFeedItemRow[]) {
  const items = rows
    .map((row) => {
      const title = row.title.trim()
      const description = row.description.trim()
      const href = row.href.trim()
      const label = row.label.trim()
      const meta = row.meta.trim()

      if (!title && !description && !href && !label && !meta) {
        return null
      }

      return {
        description: description || undefined,
        href: href || undefined,
        label: label || undefined,
        meta: meta || undefined,
        title: title || undefined,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  return items.length > 0 ? items : undefined
}

export function AdminCmsFeedItemsEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminCmsFeedItemRow[]) => void
  rows: AdminCmsFeedItemRow[]
}>) {
  return (
    <EditorShell hint={hint} label={label}>
      <div className="grid gap-3">
        {rows.length === 0
          ? renderEmptyState("No cards added yet.")
          : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <AdminFontTextField
                disabled={disabled}
                label={`Card ${index + 1} eyebrow`}
                storage="html"
                value={row.label}
                onChange={(value) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            label: value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminFontTextField
                disabled={disabled}
                label="Meta text"
                storage="html"
                value={row.meta}
                onChange={(value) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            meta: value,
                          }
                        : current,
                    ),
                  )
                }
              />
            </div>

            <AdminFontTextField
              disabled={disabled}
              label="Title"
              storage="html"
              value={row.title}
              onChange={(value) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          title: value,
                        }
                      : current,
                  ),
                )
              }
            />

            <AdminFontTextField
              disabled={disabled}
              label="Description"
              multiline
              preserveParagraphs
              rows={4}
              storage="html"
              value={row.description}
              onChange={(value) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          description: value,
                        }
                      : current,
                  ),
                )
              }
            />

            <AdminInput
              disabled={disabled}
              label="Link"
              value={row.href}
              onChange={(event) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          href: event.target.value,
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
                  onChange(rows.filter((current) => current.id !== row.id))
                }
              >
                Remove card
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createFeedItemRow()])}
          >
            Add card
          </button>
        </div>
      </div>
    </EditorShell>
  )
}

export interface AdminCmsCtaRow {
  description: string
  href: string
  id: string
  label: string
  title: string
  tone: "primary" | "secondary"
}

function createCtaRow(partial?: Partial<AdminCmsCtaRow>): AdminCmsCtaRow {
  return {
    description: "",
    href: "",
    id: createRowId("cms-cta"),
    label: "",
    title: "",
    tone: "primary",
    ...partial,
  }
}

export function buildCmsCtaRows(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null
          }

          return createCtaRow({
            description:
              typeof entry.description === "string" ? entry.description : "",
            href: typeof entry.href === "string" ? entry.href : "",
            label: typeof entry.label === "string" ? entry.label : "",
            title: typeof entry.title === "string" ? entry.title : "",
            tone:
              entry.tone === "secondary" ? "secondary" : "primary",
          })
        })
        .filter((entry): entry is AdminCmsCtaRow => Boolean(entry))
    : []
}

export function serializeCmsCtaRows(rows: AdminCmsCtaRow[]) {
  const items = rows
    .map((row) => {
      const title = row.title.trim()
      const description = row.description.trim()
      const href = row.href.trim()
      const label = row.label.trim()

      if (!title && !description && !href && !label) {
        return null
      }

      return {
        description: description || undefined,
        href: href || undefined,
        label: label || undefined,
        title: title || undefined,
        tone: row.tone,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  return items.length > 0 ? items : undefined
}

export function AdminCmsCtaEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminCmsCtaRow[]) => void
  rows: AdminCmsCtaRow[]
}>) {
  return (
    <EditorShell hint={hint} label={label}>
      <div className="grid gap-3">
        {rows.length === 0 ? renderEmptyState("No actions added yet.") : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <AdminFontTextField
                disabled={disabled}
                label={`Action ${index + 1} button label`}
                storage="html"
                value={row.label}
                onChange={(value) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            label: value,
                          }
                        : current,
                    ),
                  )
                }
              />
              <AdminSelect
                disabled={disabled}
                label="Button style"
                value={row.tone}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            tone: event.target.value as "primary" | "secondary",
                          }
                        : current,
                    ),
                  )
                }
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </AdminSelect>
            </div>

            <AdminFontTextField
              disabled={disabled}
              label="Title"
              storage="html"
              value={row.title}
              onChange={(value) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          title: value,
                        }
                      : current,
                  ),
                )
              }
            />

            <AdminFontTextField
              disabled={disabled}
              label="Description"
              multiline
              preserveParagraphs
              rows={4}
              storage="html"
              value={row.description}
              onChange={(value) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          description: value,
                        }
                      : current,
                  ),
                )
              }
            />

            <AdminInput
              disabled={disabled}
              label="Link"
              value={row.href}
              onChange={(event) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          href: event.target.value,
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
                  onChange(rows.filter((current) => current.id !== row.id))
                }
              >
                Remove action
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createCtaRow()])}
          >
            Add action
          </button>
        </div>
      </div>
    </EditorShell>
  )
}
