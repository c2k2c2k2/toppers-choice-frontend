"use client";

import { ErrorState } from "@/components/primitives/error-state";

export default function PublicError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <ErrorState
        title="The public surface hit an error."
        description={
          error.message ||
          "The public landing route could not complete its current server-side content request."
        }
        retryLabel="Retry public surface"
        onRetry={reset}
      />
    </div>
  );
}
