// Public error type for every service: the UI maps `code` (and `fieldErrors`) to its own copy.

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "NETWORK";

/**
 * Error returned by every service. `message` is for logs only: the UI maps
 * `code` (and `fieldErrors` for forms) to its own copy.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status?: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
