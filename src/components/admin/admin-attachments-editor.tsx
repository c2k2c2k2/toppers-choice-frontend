"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { adminQueryKeys } from "@/lib/api/query-keys"
import { useAuthenticatedMutation, useAuthSession } from "@/lib/auth"
import { getApiErrorMessage, uploadAdminFile } from "@/lib/admin"
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice"
import { AuthenticatedFilePreview } from "@/components/primitives/file-preview"
import { AdminInput } from "@/components/admin/admin-form-field"

export interface AdminAttachmentRow {
  fileAssetId: string
  id: string
  label: string
  orderIndex: string
}

function createAttachmentRow(
  partial?: Partial<AdminAttachmentRow>,
): AdminAttachmentRow {
  return {
    fileAssetId: "",
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `attachment-${Math.random().toString(36).slice(2, 10)}`,
    label: "",
    orderIndex: "",
    ...partial,
  }
}

export function buildAttachmentRows(
  attachments:
    | Array<{
        fileAssetId: string
        label?: unknown
        orderIndex?: number | null
      }>
    | null
    | undefined,
) {
  return (attachments ?? []).map((attachment) =>
    createAttachmentRow({
      fileAssetId: attachment.fileAssetId,
      label: typeof attachment.label === "string" ? attachment.label : "",
      orderIndex:
        typeof attachment.orderIndex === "number" ? String(attachment.orderIndex) : "",
    }),
  )
}

export function serializeAttachmentRows(rows: AdminAttachmentRow[]) {
  return rows
    .map((row) => {
      const fileAssetId = row.fileAssetId.trim()
      if (!fileAssetId) {
        return null
      }

      const parsedOrderIndex = Number(row.orderIndex)

      return {
        fileAssetId,
        label: row.label.trim() || undefined,
        orderIndex: Number.isFinite(parsedOrderIndex) ? parsedOrderIndex : undefined,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

export function AdminAttachmentsEditor({
  disabled,
  hint,
  label,
  onChange,
  rows,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  onChange: (rows: AdminAttachmentRow[]) => void
  rows: AdminAttachmentRow[]
}>) {
  const authSession = useAuthSession()
  const queryClient = useQueryClient()
  const [selectedFilesByRowId, setSelectedFilesByRowId] = useState<
    Record<string, File | null>
  >({})
  const canManageFiles = authSession.hasPermission("content.files.manage")
  const uploadMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        file: File
        rowId: string
      },
      accessToken,
    ) =>
      uploadAdminFile(
        {
          accessLevel: "AUTHENTICATED",
          file: input.file,
          purpose: "GENERIC_PDF",
        },
        accessToken,
      ).then((asset) => ({
        asset,
        rowId: input.rowId,
      })),
    onSuccess: async ({ asset, rowId }) => {
      onChange(
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                fileAssetId: asset.id,
                label: row.label.trim() || asset.originalFileName,
              }
            : row,
        ),
      )
      setSelectedFilesByRowId((current) => ({
        ...current,
        [rowId]: null,
      }))
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.assets({
          accessLevel: "AUTHENTICATED",
          purpose: "GENERIC_PDF",
          status: "READY",
        }),
      })
    },
  })

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
            No attachments added yet.
          </div>
        ) : null}

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
              <AdminInput
                label={`Attachment ${index + 1} asset ID`}
                disabled={disabled}
                value={row.fileAssetId}
                onChange={(event) =>
                  onChange(
                    rows.map((current) =>
                      current.id === row.id
                        ? {
                            ...current,
                            fileAssetId: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
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
            </div>

            <AdminInput
              label="Attachment label"
              disabled={disabled}
              value={row.label}
              onChange={(event) =>
                onChange(
                  rows.map((current) =>
                    current.id === row.id
                      ? {
                          ...current,
                          label: event.target.value,
                        }
                      : current,
                  ),
                )
              }
            />

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="file"
                accept="application/pdf"
                className="tc-input py-3"
                disabled={disabled || !canManageFiles}
                onChange={(event) =>
                  setSelectedFilesByRowId((current) => ({
                    ...current,
                    [row.id]: event.target.files?.[0] ?? null,
                  }))
                }
              />
              <button
                type="button"
                className="tc-button-secondary"
                disabled={
                  disabled ||
                  !canManageFiles ||
                  !selectedFilesByRowId[row.id] ||
                  uploadMutation.isPending
                }
                onClick={() => {
                  const file = selectedFilesByRowId[row.id]

                  if (!file) {
                    return
                  }

                  uploadMutation.mutate({
                    file,
                    rowId: row.id,
                  })
                }}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload PDF"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {row.fileAssetId.trim() ? (
                <div className="flex items-center gap-3">
                  <AuthenticatedFilePreview
                    assetId={row.fileAssetId.trim()}
                    fileName={row.label || "Attachment"}
                    label="Preview attachment"
                    thumbClassName="h-14 w-14"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                      Preview
                    </p>
                    <p className="mt-1 max-w-64 truncate text-xs text-[color:var(--muted)]">
                      {row.fileAssetId.trim()}
                    </p>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                className="tc-button-secondary"
                disabled={disabled}
                onClick={() =>
                  onChange(rows.filter((current) => current.id !== row.id))
                }
              >
                Remove attachment
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-start">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={disabled}
            onClick={() => onChange([...rows, createAttachmentRow()])}
          >
            Add attachment
          </button>
        </div>

        {!canManageFiles ? (
          <AdminInlineNotice tone="warning">
            This session cannot upload files. Paste an existing ready PDF asset ID instead.
          </AdminInlineNotice>
        ) : null}

        {uploadMutation.error ? (
          <AdminInlineNotice tone="warning">
            {getApiErrorMessage(
              uploadMutation.error,
              "The PDF upload could not be completed.",
            )}
          </AdminInlineNotice>
        ) : null}
      </div>
    </div>
  )
}
