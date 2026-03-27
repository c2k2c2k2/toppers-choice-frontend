"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  getAdminAsset,
  getApiErrorMessage,
  listAdminAssets,
  uploadAdminFile,
  type FileAssetAccessLevel,
  type FileAssetPurpose,
} from "@/lib/admin";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";

export function AdminFileAssetField({
  accept,
  accessLevel = "PROTECTED",
  description,
  emptyDescription,
  label,
  onChange,
  purpose,
  recentLimit = 5,
  value,
}: Readonly<{
  accept: string;
  accessLevel?: FileAssetAccessLevel;
  description?: string;
  emptyDescription?: string;
  label: string;
  onChange: (assetId: string) => void;
  purpose: FileAssetPurpose;
  recentLimit?: number;
  value: string;
}>) {
  const queryClient = useQueryClient();
  const authSession = useAuthSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canReadFiles = authSession.hasPermission("content.files.read");
  const canManageFiles = authSession.hasPermission("content.files.manage");

  const currentAssetQuery = useAuthenticatedQuery({
    enabled: canReadFiles && value.trim().length > 0,
    queryFn: (accessToken) => getAdminAsset(value, accessToken),
    queryKey: ["admin", "asset", value],
    staleTime: 30_000,
  });

  const recentAssetsQuery = useAuthenticatedQuery({
    enabled: canReadFiles,
    queryFn: (accessToken) =>
      listAdminAssets(accessToken, {
        accessLevel,
        purpose,
        status: "READY",
      }),
    queryKey: adminQueryKeys.assets({
      accessLevel,
      purpose,
      status: "READY",
    }),
    staleTime: 30_000,
  });

  const uploadMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        accessLevel: FileAssetAccessLevel;
        file: File;
        purpose: FileAssetPurpose;
      },
      accessToken,
    ) => uploadAdminFile(input, accessToken),
    onSuccess: async (asset) => {
      setSelectedFile(null);
      setMessage(`${asset.originalFileName} uploaded and linked.`);
      onChange(asset.id);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.assets({
          accessLevel,
          purpose,
          status: "READY",
        }),
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "asset", asset.id],
      });
    },
  });

  const currentAsset = currentAssetQuery.data ?? null;

  return (
    <AdminFormField label={label} hint={description}>
      <div className="tc-panel rounded-[24px] p-4">
        <div className="flex flex-col gap-4">
          {!canReadFiles && !canManageFiles ? (
            <AdminInlineNotice tone="warning">
              This session cannot read or upload files right now.
            </AdminInlineNotice>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="file"
              accept={accept}
              className="tc-input py-3"
              disabled={!canManageFiles}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="tc-button-primary"
              disabled={!canManageFiles || !selectedFile || uploadMutation.isPending}
              onClick={() => {
                if (!selectedFile) {
                  return;
                }

                setMessage(null);
                uploadMutation.mutate({
                  accessLevel,
                  file: selectedFile,
                  purpose,
                });
              }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload file"}
            </button>
          </div>

          {uploadMutation.error ? (
            <AdminInlineNotice tone="warning">
              {getApiErrorMessage(uploadMutation.error, "The file upload could not be completed.")}
            </AdminInlineNotice>
          ) : null}

          {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Linked file
              </p>
              {currentAsset ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold text-[color:var(--brand)]">
                    {currentAsset.originalFileName}
                  </p>
                  <p className="text-[color:var(--muted)]">
                    {currentAsset.contentType} · {currentAsset.status}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="tc-code-chip">{currentAsset.id}</span>
                    <button
                      type="button"
                      className="tc-button-secondary"
                      onClick={() => {
                        setMessage(null);
                        onChange("");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {emptyDescription ?? "No file is linked yet."}
                </p>
              )}
            </div>

            <div className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Recent files
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {recentAssetsQuery.data?.items.slice(0, recentLimit).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white px-3 py-3 text-left transition hover:border-[rgba(0,51,102,0.2)] hover:bg-[rgba(0,51,102,0.03)]"
                    onClick={() => {
                      setMessage(null);
                      onChange(asset.id);
                    }}
                  >
                    <p className="font-semibold text-[color:var(--brand)]">
                      {asset.originalFileName}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {asset.contentType} · {asset.id}
                    </p>
                  </button>
                ))}
                {recentAssetsQuery.error ? (
                  <p className="text-sm leading-6 text-[color:var(--muted)]">
                    {getApiErrorMessage(
                      recentAssetsQuery.error,
                      "Recent files could not be loaded.",
                    )}
                  </p>
                ) : null}
                {recentAssetsQuery.data?.items.length === 0 ? (
                  <p className="text-sm leading-6 text-[color:var(--muted)]">
                    No ready files have been uploaded for this file type yet.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFormField>
  );
}
