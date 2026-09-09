import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiFetch } from "~/lib/api/client";
import { ApiError } from "~/lib/api/errors";

/**
 * The contract these tests protect: a failure NEVER degrades into a successful
 * empty result. Every failure mode raises a typed ApiError so the UI can tell
 * "the backend is down" apart from "the backend returned zero records".
 */

const schema = z.array(z.object({ id: z.number() }));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(body: string, status = 500): Response {
  return new Response(body, { status, headers: { "content-type": "text/html" } });
}

async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
    expect.unreachable("expected the call to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }

  throw new Error("unreachable");
}

beforeEach(() => {
  vi.stubEnv("EDUVAULT_API_URL", "https://api.example.com");
});

describe("apiFetch success", () => {
  it("returns validated data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }, { id: 2 }])),
    );

    await expect(apiFetch("/things", { schema })).resolves.toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("returns a legitimately empty list as an empty list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])));

    await expect(apiFetch("/things", { schema })).resolves.toEqual([]);
  });

  it("sends the bearer token when one is supplied", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/things", { schema, token: "secret-token" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer secret-token");
  });

  it("sends no Authorization header for a public call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/things", { schema });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("defaults user-specific requests to no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/things", { schema });

    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
  });

  it("serialises the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/dashboard", { schema, query: { year: 2026, month: 9 } });

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/dashboard?year=2026&month=9");
  });
});

describe("apiFetch failure classification", () => {
  it("maps 401 to unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Invalid token" }, 401)),
    );

    const error = await expectApiError(apiFetch("/dashboard", { schema }));
    expect(error.kind).toBe("unauthorized");
    expect(error.isAuthError).toBe(true);
    expect(error.status).toBe(401);
  });

  it("maps 403 to forbidden", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Nope" }, 403)));

    expect((await expectApiError(apiFetch("/x", { schema }))).kind).toBe("forbidden");
  });

  it("maps 404 to not_found and keeps the backend detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Paper not found." }, 404)),
    );

    const error = await expectApiError(apiFetch("/x", { schema }));
    expect(error.kind).toBe("not_found");
    expect(error.detail).toBe("Paper not found.");
  });

  it("maps 422 to validation and extracts FastAPI's issue list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            detail: [
              { loc: ["body", "duration_minutes"], msg: "Input should be less than 240", type: "x" },
            ],
          },
          422,
        ),
      ),
    );

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("validation");
    expect(error.issues).toEqual([
      { field: "duration_minutes", message: "Input should be less than 240" },
    ]);
  });

  it("maps a 500 to upstream_unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "boom" }, 500)));

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("upstream_unavailable");
  });

  it("does not crash on an HTML error page from the host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(textResponse("<html><body>502 Bad Gateway</body></html>", 502)),
    );

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("upstream_unavailable");
  });

  it("reports a non-JSON 200 as a contract error, not as data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>hi</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })),
    );

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("contract");
  });

  it("reports a schema mismatch as a contract error rather than passing it through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([{ id: "one" }])));

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("contract");
    expect(error.issues.length).toBeGreaterThan(0);
  });

  it("maps a network failure to upstream_unavailable, never to an empty array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("upstream_unavailable");
  });

  it("maps an abort to a timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")),
    );

    const error = await expectApiError(apiFetch("/x", { method: "POST", schema }));
    expect(error.kind).toBe("timeout");
  });

  it("surfaces a configuration problem instead of falling back to a hard-coded URL", async () => {
    vi.stubEnv("EDUVAULT_API_URL", "");
    vi.stubGlobal("fetch", vi.fn());

    const error = await expectApiError(apiFetch("/x", { schema }));
    expect(error.kind).toBe("config");
  });
});

describe("retry policy", () => {
  it("retries a GET once after a 5xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "boom" }, 503))
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]));

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/things", { schema })).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never retries a POST, so a booking or submission cannot be duplicated", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "boom" }, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expectApiError(apiFetch("/sessions/book", { method: "POST", schema }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "nope" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expectApiError(apiFetch("/things", { schema }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
