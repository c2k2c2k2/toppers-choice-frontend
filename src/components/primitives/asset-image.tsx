"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useEffectEvent, useState } from "react";
import { buildApiUrl } from "@/lib/api/config";
import { useAuthSession } from "@/lib/auth";

type AssetLike = {
  accessLevel: "ADMIN_ONLY" | "AUTHENTICATED" | "PROTECTED" | "PUBLIC";
  contentType: string;
  id: string;
  protectedDeliveryPath: string;
  publicDeliveryPath: string;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AssetImage({
  alt,
  asset,
  className,
  ...props
}: Readonly<{
  alt: string;
  asset: AssetLike;
} & Omit<ComponentPropsWithoutRef<"img">, "alt" | "src">>) {
  const authSession = useAuthSession();
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(asset.accessLevel !== "PUBLIC");
  const [hasError, setHasError] = useState(false);

  const resolveAuthenticatedSource = useEffectEvent(async (nextAsset: AssetLike) => {
    const accessToken = await authSession.ensureAccessToken();
    if (!accessToken) {
      throw new Error("No active session is available for this asset.");
    }

    const response = await fetch(buildApiUrl(nextAsset.protectedDeliveryPath), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Asset ${nextAsset.id} could not be loaded.`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  });

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    async function resolveSource() {
      if (asset.accessLevel === "PUBLIC") {
        setSrc(buildApiUrl(asset.publicDeliveryPath));
        setHasError(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        objectUrl = await resolveAuthenticatedSource(asset);
        if (isCancelled) {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          return;
        }

        setSrc(objectUrl);
        setIsLoading(false);
      } catch {
        if (isCancelled) {
          return;
        }

        setSrc(null);
        setHasError(true);
        setIsLoading(false);
      }
    }

    void resolveSource();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    asset,
    authSession.sessionId,
  ]);

  if (!src) {
    return (
      <div
        className={joinClasses(
          "flex min-h-24 items-center justify-center rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-white/70 px-4 py-6 text-center text-sm text-[color:var(--muted)]",
          className,
        )}
      >
        {isLoading
          ? "Loading image..."
          : hasError
            ? "Image preview could not be loaded."
            : "Image is not available yet."}
      </div>
    );
  }

  // `next/image` cannot reliably optimize authenticated blob URLs, so this renderer
  // intentionally falls back to a plain image element for question/media assets.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt} className={className} src={src} />;
}
