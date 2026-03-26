"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  getApiErrorMessage,
  listAdminAssets,
  uploadAdminFile,
  type FileAssetAccessLevel,
  type FileAssetPurpose,
} from "@/lib/admin";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";

interface AdminAssetUploaderProps {
  accessLevel?: FileAssetAccessLevel;
  assetId: string;
  currentAsset?: {
    accessLevel?: string;
    contentType?: string;
    id: string;
    originalFileName: string;
    publicDeliveryPath?: string;
    status?: string;
  } | null;
  label: string;
  onAssetChange: (asset: {
    accessLevel?: string;
    contentType?: string;
    id: string;
    originalFileName: string;
    publicDeliveryPath?: string;
    status?: string;
  } | null) => void;
  purpose?: FileAssetPurpose;
}

export function AdminAssetUploader({
  accessLevel = "PUBLIC",
  assetId,
  currentAsset,
  label,
  onAssetChange,
  purpose = "CMS_IMAGE",
}: Readonly<AdminAssetUploaderProps>) {
  const queryClient = useQueryClient();
  const authSession = useAuthSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canReadFiles = authSession.hasPermission("content.files.read");
  const canManageFiles = authSession.hasPermission("content.files.manage");

  const recentAssetsQuery = useAuthenticatedQuery({
    enabled: canReadFiles,
    queryFn: (accessToken) =>
      listAdminAssets(accessToken, {
        accessLevel,
        purpose,
        status: "READY",
      }),
    queryKey: queryKeys.admin.assets({
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
      setMessage(`Uploaded ${asset.originalFileName} and linked it to this record.`);
      onAssetChange(asset);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.assets({
          accessLevel,
          purpose,
          status: "READY",
        }),
      });
    },
  });

  const effectiveAsset = currentAsset ?? null;

  return (
    <div className="tc-panel rounded-[24px] p-4">
      <div className="flex flex-col gap-4">
        <div>
          <p className="tc-form-label">{label}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Upload a fresh CMS asset or reuse a recent ready image from the shared admin file flow.
          </p>
        </div>

        {!canReadFiles && !canManageFiles ? (
          <AdminInlineNotice>
            This session does not have file permissions. You can still save the record with an existing asset ID later if needed.
          </AdminInlineNotice>
        ) : null}

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="file"
            accept="image/*"
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
            {uploadMutation.isPending ? "Uploading..." : "Upload asset"}
          </button>
        </div>

        {uploadMutation.error ? (
          <AdminInlineNotice tone="warning">
            {getApiErrorMessage(uploadMutation.error, "The asset upload could not be completed.")}
          </AdminInlineNotice>
        ) : null}

        {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Linked asset
            </p>
            {effectiveAsset ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-semibold text-[color:var(--brand)]">
                  {effectiveAsset.originalFileName}
                </p>
                <p className="text-[color:var(--muted)]">
                  Asset ID: <span className="tc-code-chip">{effectiveAsset.id}</span>
                </p>
                <p className="text-[color:var(--muted)]">
                  {effectiveAsset.contentType ?? "image/*"} · {effectiveAsset.status ?? "READY"}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    className="tc-button-secondary"
                    onClick={() => onAssetChange(null)}
                  >
                    Remove asset
                  </button>
                  {assetId ? (
                    <span className="tc-code-chip">{assetId}</span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                No asset is linked yet. Public/student CMS records can still save without an image.
              </p>
            )}
          </div>

          <div className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Recent ready assets
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {recentAssetsQuery.data?.items.slice(0, 5).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white px-3 py-3 text-left transition hover:border-[rgba(0,51,102,0.2)] hover:bg-[rgba(0,51,102,0.03)]"
                  onClick={() => {
                    setMessage(null);
                    onAssetChange(asset);
                  }}
                >
                  <p className="font-semibold text-[color:var(--brand)]">
                    {asset.originalFileName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {asset.id} · {asset.status}
                  </p>
                </button>
              ))}
              {recentAssetsQuery.error ? (
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  {getApiErrorMessage(
                    recentAssetsQuery.error,
                    "Recent assets could not be loaded for this session.",
                  )}
                </p>
              ) : null}
              {recentAssetsQuery.data?.items.length === 0 ? (
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  No ready CMS assets yet. The first upload here will populate this list for reuse.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
