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
        title="The website hit an error."
        description={
          error.message ||
          "We couldn't load the website content right now."
        }
        retryLabel="Try website again"
        onRetry={reset}
      />
    </div>
  );
}
