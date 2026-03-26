"use client";

import { ErrorState } from "@/components/primitives/error-state";

export default function StudentError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <ErrorState
      title="The student surface hit an error."
      description={error.message}
      retryLabel="Retry student surface"
      onRetry={reset}
    />
  );
}
