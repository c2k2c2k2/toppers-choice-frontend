import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
          if (
            isApiError(error) &&
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 429
          ) {
            return false;
          }

          return failureCount < 2;
        },
      },
      mutations: {
        retry(failureCount, error) {
          if (isApiError(error) && error.status >= 400 && error.status < 500) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}
