import type { UseFormSetError } from "react-hook-form";

import { isApiError } from "./errors";

/**
 * Maps a 422 API error's `fields` map onto react-hook-form's `setError`,
 * rendering each server-side validation message inline under the matching input.
 * Returns true if errors were mapped (caller should not close the modal).
 */
export function mapFieldErrors(
  error: unknown,
  setError: UseFormSetError<Record<string, unknown>>,
): boolean {
  if (!isApiError(error) || error.status !== 422 || !error.fields) {
    return false;
  }

  for (const [field, message] of Object.entries(error.fields)) {
    setError(field, { message });
  }

  return true;
}
