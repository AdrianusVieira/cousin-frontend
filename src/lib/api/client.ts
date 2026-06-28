import { env } from "@/lib/env";
import { getAccessToken, supabase } from "@/lib/supabase";
import type { ApiErrorBody } from "@/types/api";

import { ApiError, NetworkError } from "./errors";

/**
 * Generous timeout so we don't abort a Render cold start (~30–60s) that would have
 * succeeded. See frontend-integration.md §3.
 */
const DEFAULT_TIMEOUT_MS = 60_000;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${env.apiUrl}/api${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody["error"];

  try {
    body = ((await response.json()) as ApiErrorBody).error;
  } catch {
    body = { code: "UNKNOWN", message: response.statusText || "Request failed" };
  }

  return new ApiError(response.status, body);
}

/**
 * One typed fetch wrapper for the whole app:
 * - injects the Supabase bearer token,
 * - parses the error envelope into a typed `ApiError`,
 * - applies a 60s timeout,
 * - on `401`, refreshes the Supabase session once and retries before surfacing.
 *
 * Cold-start *retry/backoff* lives in the TanStack Query defaults (lib/query.ts), so a
 * transient first-call failure self-heals without bespoke logic here.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options, true);
}

async function send<T>(path: string, options: RequestOptions, allowRefresh: boolean): Promise<T> {
  const { body, method = "GET", query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    throw new NetworkError(
      controller.signal.aborted ? "Request timed out (server may be waking up)" : "Network error",
      cause,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && allowRefresh) {
    const { data } = await supabase.auth.refreshSession();

    if (data.session) {
      return send<T>(path, options, false);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  patch: <T>(path: string, body: unknown, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, body, method: "PATCH" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method">) =>
    request<T>(path, { ...options, body, method: "POST" }),
};
