import { env } from "@/lib/env";

/**
 * `GET /health` is the only route outside `/api` and the only unauthenticated one.
 * Used for the cold-start warm-up gate: poll until it returns 200 before showing the app.
 * Returns true when the DB is reachable (200), false otherwise (503 / network error).
 */
export async function checkHealth(timeoutMs = 60_000): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.apiUrl}/health`, { signal: controller.signal });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
