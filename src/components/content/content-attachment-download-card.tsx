"use client";

import { useState } from "react";
import { useAuthSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/api/config";
import type { ContentAttachment } from "@/lib/content";

function formatFileSize(value: number | null) {
  if (!value || value <= 0) {
    return "Size unavailable";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getTextValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function ContentAttachmentDownloadCard({
  attachment,
}: Readonly<{
  attachment: ContentAttachment;
}>) {
  const authSession = useAuthSession();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileName = getTextValue(
    attachment.fileAsset.originalFileName,
    "attachment.pdf",
  );
  const attachmentLabel = getTextValue(attachment.label, fileName);
  const contentType = getTextValue(
    attachment.fileAsset.contentType,
    "application/octet-stream",
  );
  const accessLevel = getTextValue(attachment.fileAsset.accessLevel, "PROTECTED");
  const sizeBytes = getNumberValue(attachment.fileAsset.sizeBytes);
  const isPublicAsset = accessLevel === "PUBLIC";

  async function handleProtectedDownload() {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const accessToken = await authSession.ensureAccessToken();

      if (!accessToken) {
        throw new Error("A signed-in session is required for secure attachments.");
      }

      const response = await fetch(
        buildApiUrl(attachment.fileAsset.protectedDeliveryPath),
        {
          cache: "no-store",
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("The attachment download could not be completed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      triggerDownload(objectUrl, fileName);
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 0);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "The attachment download could not be completed.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <article className="tc-card rounded-[24px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tc-overline">Attachment</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
            {attachmentLabel}
          </p>
        </div>
        <span className="tc-code-chip">{formatFileSize(sizeBytes)}</span>
      </div>

      <p className="tc-muted mt-3 text-sm leading-6">
        {fileName} · {contentType}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isPublicAsset ? (
          <a
            className="tc-button-secondary"
            href={buildApiUrl(attachment.fileAsset.publicDeliveryPath)}
            rel="noreferrer"
            target="_blank"
          >
            Open attachment
          </a>
        ) : (
          <button
            type="button"
            className="tc-button-secondary"
            disabled={isDownloading}
            onClick={() => void handleProtectedDownload()}
          >
            {isDownloading ? "Downloading..." : "Secure download"}
          </button>
        )}
        <span className="tc-code-chip">{accessLevel}</span>
      </div>

      {downloadError ? (
        <p className="mt-3 text-sm leading-6 text-[color:#9f2f16]">
          {downloadError}
        </p>
      ) : null}
    </article>
  );
}
