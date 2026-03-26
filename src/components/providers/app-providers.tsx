"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "@/lib/api/query-client";
import { AuthSessionProvider } from "@/lib/auth";
import { PwaProvider } from "@/components/providers/pwa-provider";

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <PwaProvider>{children}</PwaProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
