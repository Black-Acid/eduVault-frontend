import { describe, expect, it } from "vitest";

import { ApiError, isApiError, kindForStatus, parseErrorPayload, toUserMessage } from "~/lib/api/errors";

describe("status classification", () => {
  it("maps the statuses the backend actually returns", () => {
    expect(kindForStatus(401)).toBe("unauthorized");
    expect(kindForStatus(403)).toBe("forbidden");
    expect(kindForStatus(404)).toBe("not_found");
    expect(kindForStatus(400)).toBe("validation");
    expect(kindForStatus(422)).toBe("validation");
    expect(kindForStatus(500)).toBe("upstream_unavailable");
    expect(kindForStatus(503)).toBe("upstream_unavailable");
  });

  it("falls back to unexpected for anything else", () => {
    expect(kindForStatus(418)).toBe("unexpected");
  });
});

describe("FastAPI error payloads", () => {
  it("reads a string detail", () => {
    expect(parseErrorPayload({ detail: "Paper not found." })).toEqual({
      detail: "Paper not found.",
      issues: [],
    });
  });

  it("reads a 422 issue list and strips the 'body' prefix", () => {
    const parsed = parseErrorPayload({
      detail: [{ loc: ["body", "email"], msg: "field required", type: "missing" }],
    });

    expect(parsed.issues).toEqual([{ field: "email", message: "field required" }]);
    expect(parsed.detail).toBe("field required");
  });

  it("tolerates a bare string body", () => {
    expect(parseErrorPayload("Server exploded").detail).toBe("Server exploded");
  });

  it("tolerates null, arrays of junk and unknown shapes", () => {
    expect(parseErrorPayload(null)).toEqual({ detail: null, issues: [] });
    expect(parseErrorPayload({ detail: [{}, 5] })).toEqual({ detail: null, issues: [] });
    expect(parseErrorPayload({ unexpected: true })).toEqual({ detail: null, issues: [] });
  });
});

describe("user-facing messages", () => {
  it("uses the backend detail where it is meaningful to a student", () => {
    const error = new ApiError("validation", "x", { detail: "Choose a future date." });
    expect(toUserMessage(error)).toBe("Choose a future date.");
  });

  it("never leaks an internal detail for a server failure", () => {
    const error = new ApiError("upstream_unavailable", "x", {
      detail: "psycopg2.OperationalError: connection refused",
    });

    expect(toUserMessage(error)).not.toMatch(/psycopg2/);
    expect(toUserMessage(error)).toMatch(/not responding/i);
  });

  it("tells the user to log in again on a 401", () => {
    expect(toUserMessage(new ApiError("unauthorized", "x"))).toMatch(/log in/i);
  });

  it("has a message for a contract violation", () => {
    expect(toUserMessage(new ApiError("contract", "x"))).toMatch(/unexpected format/i);
  });

  it("falls back for a non-ApiError", () => {
    expect(toUserMessage(new Error("boom"))).toMatch(/something went wrong/i);
    expect(toUserMessage("nope")).toMatch(/something went wrong/i);
  });
});

describe("ApiError", () => {
  it("identifies auth failures", () => {
    expect(new ApiError("unauthorized", "x").isAuthError).toBe(true);
    expect(new ApiError("forbidden", "x").isAuthError).toBe(false);
  });

  it("is recognised by the type guard", () => {
    expect(isApiError(new ApiError("unexpected", "x"))).toBe(true);
    expect(isApiError(new Error("x"))).toBe(false);
  });

  it("produces a log line with no request body, header or token", () => {
    const line = new ApiError("unauthorized", "Token rejected", {
      status: 401,
      endpoint: "/dashboard",
    }).toLogLine();

    expect(line).toContain("kind=unauthorized");
    expect(line).toContain("status=401");
    expect(line).toContain("endpoint=/dashboard");
    expect(line).not.toMatch(/bearer/i);
  });

  it("defaults status to null when the request never reached the backend", () => {
    expect(new ApiError("upstream_unavailable", "x").status).toBeNull();
  });
});
