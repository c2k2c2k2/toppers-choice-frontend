"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  getAdminAsset,
  getApiErrorMessage,
  uploadAdminFile,
} from "@/lib/admin";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AssetImage } from "@/components/primitives/asset-image";

export function AdminQuestionMediaField({
  description,
  emptyDescription,
  label,
  onChange,
  value,
}: Readonly<{
  description?: string;
  emptyDescription?: string;
  label: string;
  onChange: (assetId: string) => void;
  value: string;
}>) {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canReadFiles = authSession.hasPermission("content.files.read");
  const canManageFiles = authSession.hasPermission("content.files.manage");

  const assetQuery = useAuthenticatedQuery({
    enabled: canReadFiles && value.trim().length > 0,
    queryFn: (accessToken) => getAdminAsset(value, accessToken),
    queryKey: ["admin", "asset", value],
    staleTime: 30_000,
  });

  const uploadMutation = useAuthenticatedMutation({
    mutationFn: (file: File, accessToken) =>
      uploadAdminFile(
        {
          accessLevel: "AUTHENTICATED",
          file,
          purpose: "QUESTION_IMAGE",
        },
        accessToken,
      ),
    onSuccess: async (asset) => {
      setSelectedFile(null);
      setMessage(`${asset.originalFileName} uploaded and linked.`);
      onChange(asset.id);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "asset", asset.id],
      });
    },
  });

  return (
    <AdminFormField label={label} hint={description}>
      <div className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
        <div className="flex flex-col gap-4">
          {!canReadFiles && !canManageFiles ? (
            <AdminInlineNotice tone="warning">
              This session cannot read or upload files right now.
            </AdminInlineNotice>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="tc-input py-3"
              disabled={!canManageFiles}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="tc-button-secondary"
              disabled={!canManageFiles || !selectedFile || uploadMutation.isPending}
              onClick={() => {
                if (!selectedFile) {
                  return;
                }

                setMessage(null);
                uploadMutation.mutate(selectedFile);
              }}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload file"}
            </button>
          </div>

          {uploadMutation.error ? (
            <AdminInlineNotice tone="warning">
              {getApiErrorMessage(uploadMutation.error, "The image upload could not be completed.")}
            </AdminInlineNotice>
          ) : null}

          {assetQuery.error ? (
            <AdminInlineNotice tone="warning">
              {getApiErrorMessage(assetQuery.error, "The linked image could not be loaded.")}
            </AdminInlineNotice>
          ) : null}

          {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

          {assetQuery.data ? (
            <div className="space-y-3">
              <AssetImage
                alt={label}
                asset={assetQuery.data}
                className="max-h-48 w-full rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white object-contain"
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-[color:var(--brand)]">
                  {assetQuery.data.originalFileName}
                </span>
                <span className="tc-code-chip">{assetQuery.data.id}</span>
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
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {emptyDescription ?? "No image is linked yet."}
            </p>
          )}
        </div>
      </div>
    </AdminFormField>
  );
}
