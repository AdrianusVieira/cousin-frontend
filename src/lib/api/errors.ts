import type { ApiErrorBody } from "@/types/api";

/** Typed wrapper around the uniform `{ error: { code, message, fields? } }` envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }

  /** 422 — validation failure; `fields` maps onto react-hook-form `setError` for inline display. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** 409 — business-rule block (e.g. DELETE_BLOCKED, ARCHIVE_BLOCKED); show as blocking notice. */
  get isBusinessRule(): boolean {
    return this.status === 409;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** Network/timeout failure before any HTTP status was received. */
export class NetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
