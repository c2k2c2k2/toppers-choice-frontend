"use client"

import { AdminInput, AdminSelect } from "@/components/admin/admin-form-field"

export interface AdminPermissionOverrideRow {
  id: string
  isAllowed: boolean
  permissionKey: string
  reason: string
}

function createPermissionOverrideRow(
  partial?: Partial<AdminPermissionOverrideRow>,
): AdminPermissionOverrideRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `permission-override-${Math.random().toString(36).slice(2, 10)}`,
    isAllowed: true,
    permissionKey: "",
    reason: "",
    ...partial,
  }
}

export function buildPermissionOverrideRows(
  overrides:
    | Array<{
        isAllowed: boolean
        permissionKey: string
        reason?: unknown
      }>
    | null
    | undefined,
) {
  return (overrides ?? []).map((override) =>
    createPermissionOverrideRow({
      isAllowed: override.isAllowed,
      permissionKey: override.permissionKey,
      reason: typeof override.reason === "string" ? override.reason : "",
    }),
  )
}

export function serializePermissionOverrideRows(
  rows: AdminPermissionOverrideRow[],
) {
  return rows
    .map((row) => {
      const permissionKey = row.permissionKey.trim()
      if (!permissionKey) {
        return null
      }

      return {
        isAllowed: row.isAllowed,
        permissionKey,
        reason: row.reason.trim() || undefined,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

export function AdminPermissionOverridesEditor({
  disabled,
  hint,
  label,
  onChange,
  permissionOptions,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminPermissionOverrideRow[]) => void
  permissionOptions: string[]
  rows: AdminPermissionOverrideRow[]
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
            No permission overrides added yet.
          </div>
        ) : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
              <AdminSelect
                label={`Override ${index + 1}`}
                disabled={disabled}
                value={row.permissionKey}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            permissionKey: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              >
                <option value="">Select permission</option>
                {permissionOptions.map((permissionKey) => (
                  <option key={permissionKey} value={permissionKey}>
                    {permissionKey}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                label="Decision"
                disabled={disabled}
                value={row.isAllowed ? "allow" : "deny"}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            isAllowed: event.target.value === "allow",
                          }
                        : current,
                    ),
                  )
                }
              >
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </AdminSelect>
            </div>

            <AdminInput
              label="Reason"
              disabled={disabled}
              value={row.reason}
              onChange={(event) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          reason: event.target.value,
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
                Remove override
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createPermissionOverrideRow()])}
          >
            Add override
          </button>
        </div>
      </div>
    </div>
  )
}
