"use client";

import { ErrorState } from "@/components/primitives/error-state";

export default function AdminError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <ErrorState
      title="The admin panel hit an error."
      description={error.message}
      retryLabel="Try admin panel again"
      onRetry={reset}
    />
  );
}
