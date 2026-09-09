import type { ZodType } from "zod";

import { buildApiUrl, DEFAULT_TIMEOUT_MS } from "./config";
import { ApiError, isApiError, kindForStatus, parseErrorPayload } from "./errors";

type QueryValue = string | number | boolean | undefined | null;

export type ApiRequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Bearer token. Only ever passed from server code. */
  token?: string | null;
  /** Runtime contract. Responses that fail it raise an ApiError of kind `contract`. */
  schema?: ZodType<T>;
  timeoutMs?: number;
  /** Next.js fetch cache mode. User-specific data must stay "no-store". */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  /**
   * Retries for transient failures. Only ever applied to GET: replaying a
   * booking or a submission could create duplicate records.
   */
  retries?: number;
  signal?: AbortSignal;
};

const RETRY_BASE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Server-side, sanitized request log. Never includes bodies, tokens or headers. */
function logRequest(
  method: string,
  endpoint: string,
  status: number | string,
  durationMs: number,
): void {
  if (process.env.NODE_ENV === "test") return;
  console.info(
    `[eduvault-api] ${method} ${endpoint} status=${status} duration=${Math.round(durationMs)}ms`,
  );
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    // Render (and most proxies) serve HTML error pages. Keep a short excerpt
    // for the log line, but never treat it as a payload.
    return { __nonJson: true, excerpt: text.slice(0, 200) };
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { __nonJson: true, excerpt: text.slice(0, 200) };
  }
}

function isNonJson(payload: unknown): payload is { __nonJson: true; excerpt: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { __nonJson?: unknown }).__nonJson === true
  );
}

function classifyNetworkError(error: unknown, endpoint: string): ApiError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("timeout", "The EduVault backend did not respond in time.", {
      endpoint,
      cause: error,
    });
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    return new ApiError("timeout", "The EduVault backend did not respond in time.", {
      endpoint,
      cause: error,
    });
  }

  return new ApiError("upstream_unavailable", "Could not reach the EduVault backend.", {
    endpoint,
    cause: error,
  });
}

/**
 * Single entry point for every backend call.
 *
 * Guarantees:
 *  - the base URL comes from configuration, never a literal;
 *  - a failure always throws a typed {@link ApiError} - it never degrades to
 *    an empty array or fabricated data;
 *  - a 2xx body is validated against `schema` before it reaches the UI.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    token,
    schema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = "no-store",
    next,
    retries = method === "GET" ? 1 : 0,
    signal,
  } = options;

  const url = buildApiUrl(path, query);
  const endpoint = `${path}`;
  const attempts = Math.max(0, method === "GET" ? retries : 0) + 1;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: next ? undefined : cache,
        next,
        signal: controller.signal,
      });

      const payload = await readBody(response);
      logRequest(method, endpoint, response.status, Date.now() - startedAt);

      if (!response.ok) {
        const kind = kindForStatus(response.status);
        const { detail, issues } = isNonJson(payload)
          ? { detail: null, issues: [] }
          : parseErrorPayload(payload);

        const error = new ApiError(kind, detail ?? `Request failed with status ${response.status}`, {
          status: response.status,
          detail,
          issues,
          endpoint,
        });

        // 5xx is worth one retry on a GET; 4xx never is.
        if (kind === "upstream_unavailable" && attempt < attempts - 1) {
          lastError = error;
          await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }

        throw error;
      }

      if (isNonJson(payload)) {
        throw new ApiError("contract", "The EduVault backend returned a non-JSON response.", {
          status: response.status,
          endpoint,
        });
      }

      if (!schema) return payload as T;

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "response",
          message: issue.message,
        }));

        console.error(
          `[eduvault-api] contract violation on ${method} ${endpoint}: ${issues
            .map((issue) => `${issue.field}: ${issue.message}`)
            .join(" | ")}`,
        );

        throw new ApiError("contract", "The EduVault backend returned an unexpected shape.", {
          status: response.status,
          issues,
          endpoint,
        });
      }

      return parsed.data;
    } catch (error) {
      if (isApiError(error)) {
        if (error.kind === "upstream_unavailable" && attempt < attempts - 1) {
          lastError = error;
          await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }

      const networkError = classifyNetworkError(error, endpoint);
      logRequest(method, endpoint, networkError.kind, Date.now() - startedAt);

      if (attempt < attempts - 1) {
        lastError = networkError;
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }

      throw networkError;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  throw lastError ?? new ApiError("unexpected", "The request could not be completed.", { endpoint });
}
