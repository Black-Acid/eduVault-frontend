import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { ApiError, isApiError, toUserMessage, type ApiErrorKind } from "./errors";

/**
 * Helpers shared by the Next.js route handlers that make up the BFF.
 *
 * Every handler funnels its failures through `errorResponse`, so an upstream
 * 401/422/500 can never be flattened into a 200 with an empty body.
 */

const STATUS_FOR_KIND: Record<ApiErrorKind, number> = {
  config: 500,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation: 422,
  upstream_unavailable: 502,
  timeout: 504,
  contract: 502,
  unexpected: 500,
};

export type ApiErrorBody = {
  error: string;
  kind: ApiErrorKind;
  issues?: { field: string; message: string }[];
};

/** Converts any thrown value into an honest JSON error response. */
export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (isApiError(error)) {
    console.error(`[eduvault-bff] ${error.toLogLine()}`);

    // Preserve the upstream status for client errors so the browser sees the
    // same class of failure the backend reported.
    const status =
      error.kind === "validation" && error.status && error.status >= 400 && error.status < 500
        ? error.status
        : STATUS_FOR_KIND[error.kind];

    return NextResponse.json(
      {
        error: toUserMessage(error),
        kind: error.kind,
        ...(error.issues.length ? { issues: error.issues } : {}),
      },
      { status },
    );
  }

  console.error("[eduvault-bff] unexpected error", error);

  return NextResponse.json(
    { error: "Something went wrong. Please try again.", kind: "unexpected" as const },
    { status: 500 },
  );
}

/**
 * Reads and validates a JSON request body.
 *
 * @throws {ApiError} kind `validation` for malformed or non-conforming input.
 */
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new ApiError("validation", "The request body was not valid JSON.", { status: 400 });
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new ApiError("validation", "The request was rejected.", {
      status: 422,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}
