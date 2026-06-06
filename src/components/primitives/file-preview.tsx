"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api/config";
import { createApiError } from "@/lib/api/errors";
import { useAuthSession } from "@/lib/auth";

type PreviewSource = {
  contentType?: string | null;
  fileName?: string | null;
  label?: string;
};

function isImageType(contentType?: string | null) {
  return Boolean(contentType?.toLowerCase().startsWith("image/"));
}

function isPdfType(contentType?: string | null) {
  return contentType?.toLowerCase() === "application/pdf";
}

function PreviewBody({
  contentType,
  fileName,
  objectUrl,
  variant,
}: Readonly<
  PreviewSource & {
    objectUrl: string | null;
    variant: "thumb" | "large";
  }
>) {
  const image = isImageType(contentType);
  const pdf = isPdfType(contentType);

  if (objectUrl && image) {
    return (
      <img
        src={objectUrl}
        alt={fileName ?? "Attachment preview"}
        className={
          variant === "large"
            ? "max-h-[76vh] w-full rounded-[18px] object-contain"
            : "h-full w-full rounded-[14px] object-cover"
        }
      />
    );
  }

  if (objectUrl && pdf && variant === "large") {
    return (
      <iframe
        src={objectUrl}
        title={fileName ?? "Attachment preview"}
        className="h-[76vh] w-[min(58rem,86vw)] rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center rounded-[14px] bg-[color:var(--surface-student)] px-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
      {pdf ? "PDF" : contentType?.split("/").at(-1) ?? "File"}
    </div>
  );
}

function PreviewModal({
  contentType,
  fileName,
  objectUrl,
  onClose,
}: Readonly<
  PreviewSource & {
    objectUrl: string | null;
    onClose: () => void;
  }
>) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(0,22,46,0.68)] p-4 backdrop-blur-sm">
      <div className="max-w-[min(62rem,92vw)]">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-full bg-white/94 px-4 py-2 shadow-sm">
          <p className="truncate text-sm font-semibold text-[color:var(--brand)]">
            {fileName ?? "File preview"}
          </p>
          <button type="button" className="tc-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <PreviewBody
          contentType={contentType}
          fileName={fileName}
          objectUrl={objectUrl}
          variant="large"
        />
      </div>
    </div>
  );
}

export function AuthenticatedFilePreview({
  assetId,
  className = "",
  contentType,
  fileName,
  label = "Preview file",
  thumbClassName = "h-20 w-20",
}: Readonly<
  PreviewSource & {
    assetId: string;
    className?: string;
    thumbClassName?: string;
  }
>) {
  const authSession = useAuthSession();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadedContentType, setLoadedContentType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const effectiveContentType = contentType ?? loadedContentType;

  useEffect(() => {
    let isCancelled = false;
    let nextObjectUrl: string | null = null;

    async function loadPreview() {
      setErrorMessage(null);
      setObjectUrl(null);
      setLoadedContentType(null);

      const accessToken = await authSession.ensureAccessToken();

      if (!accessToken) {
        setErrorMessage("Sign in is required to preview this file.");
        return;
      }

      const response = await fetch(buildApiUrl(`/assets/${encodeURIComponent(assetId)}`), {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw await createApiError(response, buildApiUrl(`/assets/${encodeURIComponent(assetId)}`));
      }

      const blob = await response.blob();
      nextObjectUrl = URL.createObjectURL(blob);

      if (!isCancelled) {
        setObjectUrl(nextObjectUrl);
        setLoadedContentType(blob.type || null);
      }
    }

    void loadPreview().catch((error) => {
      if (!isCancelled) {
        setErrorMessage(error instanceof Error ? error.message : "Preview could not be loaded.");
      }
    });

    return () => {
      isCancelled = true;

      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [assetId, authSession]);

  return (
    <div className={className}>
      <button
        type="button"
        className={`${thumbClassName} overflow-hidden rounded-[16px] border border-[rgba(0,30,64,0.1)] bg-white shadow-sm transition hover:border-[rgba(0,51,102,0.25)]`}
        aria-label={label}
        title={label}
        onClick={() => setIsOpen(true)}
      >
        <PreviewBody
          contentType={effectiveContentType}
          fileName={fileName}
          objectUrl={objectUrl}
          variant="thumb"
        />
      </button>
      {errorMessage ? (
        <p className="mt-2 max-w-48 text-xs text-[#9a3412]">{errorMessage}</p>
      ) : null}
      {isOpen ? (
        <PreviewModal
          contentType={effectiveContentType}
          fileName={fileName}
          objectUrl={objectUrl}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function LocalFilePreview({
  file,
  onRemove,
}: Readonly<{
  file: File;
  onRemove: () => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [file]);

  return (
    <div className="max-w-full overflow-hidden rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-[rgba(0,30,64,0.1)]"
          aria-label="Open attachment preview"
          onClick={() => setIsOpen(true)}
        >
          <PreviewBody
            contentType={file.type}
            fileName={file.name}
            objectUrl={objectUrl}
            variant="thumb"
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[color:var(--brand)]">
            {file.name}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <button type="button" className="tc-button-secondary shrink-0" onClick={onRemove}>
          Remove
        </button>
      </div>
      {isOpen ? (
        <PreviewModal
          contentType={file.type}
          fileName={file.name}
          objectUrl={objectUrl}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}
