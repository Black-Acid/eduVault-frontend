/**
 * Normalized error model for every EduVault backend call.
 *
 * The point of this module is that a failure must never be able to masquerade
 * as "the backend successfully returned nothing". Each distinct failure mode
 * gets its own `kind` so the UI can render an honest state.
 */

export type ApiErrorKind =
  | "config" //           frontend is misconfigured (missing EDUVAULT_API_URL)
  | "unauthorized" //     401 - token missing/expired/invalid
  | "forbidden" //        403 - authenticated but not allowed
  | "not_found" //        404
  | "validation" //       400/409/422 - request rejected by the backend
  | "upstream_unavailable" // 5xx, DNS/network failure, non-JSON error page
  | "timeout" //          request aborted by our own timeout
  | "contract" //         2xx body did not match the documented schema
  | "unexpected"; //      anything we could not classify

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ApiErrorOptions = {
  status?: number | null;
  detail?: string | null;
  issues?: ValidationIssue[];
  endpoint?: string;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or null when the request never produced one. */
  readonly status: number | null;
  /** Backend-provided detail, already reduced to a string. */
  readonly detail: string | null;
  readonly issues: ValidationIssue[];
  readonly endpoint?: string;

  constructor(kind: ApiErrorKind, message: string, options: ApiErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status ?? null;
    this.detail = options.detail ?? null;
    this.issues = options.issues ?? [];
    this.endpoint = options.endpoint;
  }

  get isAuthError(): boolean {
    return this.kind === "unauthorized";
  }

  /** Safe for logs: never contains request bodies, headers or tokens. */
  toLogLine(): string {
    return [
      `kind=${this.kind}`,
      `status=${this.status ?? "-"}`,
      this.endpoint ? `endpoint=${this.endpoint}` : null,
      `message=${this.message}`,
    ]
      .filter(Boolean)
      .join(" ");
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Maps an HTTP status to the error kind we use internally. */
export function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 400 || status === 409 || status === 422) return "validation";
  if (status >= 500) return "upstream_unavailable";
  return "unexpected";
}

/**
 * FastAPI returns either `{"detail": "message"}` or, for 422,
 * `{"detail": [{loc, msg, type}, ...]}`. Everything else is treated as opaque.
 */
export function parseErrorPayload(payload: unknown): {
  detail: string | null;
  issues: ValidationIssue[];
} {
  if (typeof payload === "string") {
    return { detail: payload.trim() || null, issues: [] };
  }

  if (!payload || typeof payload !== "object") {
    return { detail: null, issues: [] };
  }

  const record = payload as Record<string, unknown>;
  const raw = record.detail ?? record.message ?? record.error;

  if (typeof raw === "string") {
    return { detail: raw.trim() || null, issues: [] };
  }

  if (Array.isArray(raw)) {
    const issues: ValidationIssue[] = raw.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const loc = Array.isArray(item.loc)
        ? item.loc.filter((part) => part !== "body").join(".")
        : "";
      const msg = typeof item.msg === "string" ? item.msg : null;
      if (!msg) return [];
      return [{ field: loc || "request", message: msg }];
    });

    return {
      detail: issues.length ? issues.map((issue) => issue.message).join("; ") : null,
      issues,
    };
  }

  return { detail: null, issues: [] };
}

const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  config: "EduVault is not configured correctly. Please contact support.",
  unauthorized: "Your session has expired. Please log in again.",
  forbidden: "You do not have access to this resource.",
  not_found: "We could not find what you were looking for.",
  validation: "Some of the details you submitted were rejected. Please review and try again.",
  upstream_unavailable:
    "EduVault's servers are not responding right now. Please try again in a moment.",
  timeout: "The request took too long to complete. Please try again.",
  contract:
    "EduVault returned data in an unexpected format, so we could not display it safely.",
  unexpected: "Something went wrong. Please try again.",
};

/**
 * User-facing message. Prefers the backend's own detail for the error kinds
 * where it is meaningful, and never leaks internals for the rest.
 */
export function toUserMessage(error: unknown): string {
  if (!isApiError(error)) return FALLBACK_MESSAGES.unexpected;

  const usesBackendDetail =
    error.kind === "validation" || error.kind === "not_found" || error.kind === "forbidden";

  if (usesBackendDetail && error.detail) return error.detail;

  return FALLBACK_MESSAGES[error.kind];
}
