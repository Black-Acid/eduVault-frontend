import { ApiError } from "./errors";

/**
 * Server-only configuration for the EduVault backend.
 *
 * The base URL deliberately lives in `EDUVAULT_API_URL` and NOT in a
 * `NEXT_PUBLIC_*` variable: every backend call goes through a Next.js server
 * component or route handler, so the browser never needs the address and the
 * bearer token never leaves the server.
 */

/** Anything key/value shaped - `process.env` in production, a literal in tests. */
export type EnvSource = Record<string, string | undefined>;

export const API_BASE_URL_ENV = "EDUVAULT_API_URL";

/** Default per-request timeout. AI calls override this - see AI_TIMEOUT_MS. */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Gemini-backed explanations are slow; give them a much larger budget. */
export const AI_TIMEOUT_MS = 60_000;

/** Render free instances cold-start, so the first hit can be very slow. */
export const COLD_START_TIMEOUT_MS = 45_000;

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Reads and validates the backend base URL.
 *
 * @throws {ApiError} kind `config` when the variable is missing or unusable.
 */
export function getApiBaseUrl(env: EnvSource = process.env): string {
  const raw = env[API_BASE_URL_ENV];

  if (!raw || !raw.trim()) {
    throw new ApiError(
      "config",
      `${API_BASE_URL_ENV} is not set. Copy .env.example to .env.local and set the EduVault backend URL.`,
    );
  }

  const trimmed = raw.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ApiError("config", `${API_BASE_URL_ENV} is not a valid absolute URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiError("config", `${API_BASE_URL_ENV} must use http or https.`);
  }

  return stripTrailingSlashes(parsed.toString());
}

/** Joins the configured base URL with an API path and optional query params. */
export function buildApiUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
  env: EnvSource = process.env,
): string {
  const base = getApiBaseUrl(env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
