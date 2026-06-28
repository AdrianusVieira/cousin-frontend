import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "./api/errors";

/**
 * Retry/backoff rides out Render cold-start failures (frontend-integration.md §3) so
 * transient first-call errors self-heal instead of surfacing. We do NOT retry deterministic
 * client errors (4xx) — retrying a 422/404/401 is pointless.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }

        return failureCount < 4;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 15_000),
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
