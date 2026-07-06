import { QueryClient } from "@tanstack/react-query";

import { isApiError, NetworkError } from "./api/errors";

const IDEMPOTENT_METHODS = new Set(["DELETE", "GET", "PATCH"]);

/**
 * Retry/backoff rides out Render cold-start failures (frontend-integration.md §3) so
 * transient first-call errors self-heal instead of surfacing. We do NOT retry deterministic
 * client errors (4xx) — retrying a 422/404/401 is pointless.
 *
 * Mutations retry only a dropped connection (`NetworkError`) on an idempotent method
 * (GET/PATCH/DELETE). POST is never retried: a dropped connection can't prove the create
 * didn't already reach the server, and retrying risks a duplicate row.
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
      refetchOnWindowFocus: false,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 15_000),
      staleTime: 30_000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (!(error instanceof NetworkError) || !error.method || !IDEMPOTENT_METHODS.has(error.method)) {
          return false;
        }

        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 15_000),
    },
  },
});
