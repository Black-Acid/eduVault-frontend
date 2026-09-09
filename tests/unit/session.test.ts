import { describe, expect, it } from "vitest";

import type { AuthResponse } from "~/lib/api/schemas";
import {
  isExpired,
  parseExpiry,
  parseSession,
  serializeSession,
  sessionCookieOptions,
  sessionFromAuthResponse,
  type Session,
} from "~/lib/auth/session";

const validSession: Session = {
  userId: 1,
  name: "Ama Serwaa",
  email: "ama@example.com",
  role: "student",
  accessToken: "token-value",
  expiresAt: "2026-09-09T12:00:00.000Z",
};

function authResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    id: 1,
    name: "Ama Serwaa",
    email: "ama@example.com",
    role: "student",
    message: "Login successful",
    access_token: "token-value",
    token_type: "bearer",
    expires_at: "2026-09-09T12:00:00+00:00",
    ...overrides,
  };
}

describe("expiry parsing", () => {
  it("parses a timezone-aware ISO string", () => {
    expect(parseExpiry("2026-09-09T12:00:00+00:00")?.toISOString()).toBe(
      "2026-09-09T12:00:00.000Z",
    );
  });

  it("treats a naive timestamp as UTC, not as server-local time", () => {
    expect(parseExpiry("2026-09-09T12:00:00")?.toISOString()).toBe("2026-09-09T12:00:00.000Z");
  });

  it("returns null for junk", () => {
    expect(parseExpiry("not-a-date")).toBeNull();
    expect(parseExpiry("")).toBeNull();
  });
});

describe("expiry checks", () => {
  const now = new Date("2026-09-09T11:00:00Z");

  it("is not expired before the expiry instant", () => {
    expect(isExpired("2026-09-09T12:00:00Z", now)).toBe(false);
  });

  it("is expired after the expiry instant", () => {
    expect(isExpired("2026-09-09T10:00:00Z", now)).toBe(true);
  });

  it("is expired exactly at the expiry instant", () => {
    expect(isExpired("2026-09-09T11:00:00Z", now)).toBe(true);
  });

  it("fails closed on an unparseable expiry", () => {
    expect(isExpired("whenever", now)).toBe(true);
  });
});

describe("building a session from the auth response", () => {
  it("builds a student session", () => {
    const session = sessionFromAuthResponse(authResponse());

    expect(session).not.toBeNull();
    expect(session?.role).toBe("student");
    expect(session?.accessToken).toBe("token-value");
    expect(session?.expiresAt).toBe("2026-09-09T12:00:00.000Z");
  });

  it("normalises a teacher session", () => {
    expect(sessionFromAuthResponse(authResponse({ role: "teacher" }))?.role).toBe("teacher");
  });

  it("maps a legacy 'tutor' account to the teacher role", () => {
    expect(sessionFromAuthResponse(authResponse({ role: "tutor" }))?.role).toBe("teacher");
  });

  it("refuses an unrecognised role rather than guessing", () => {
    expect(sessionFromAuthResponse(authResponse({ role: "wizard" }))).toBeNull();
  });

  it("refuses an unparseable expiry", () => {
    expect(sessionFromAuthResponse(authResponse({ expires_at: "soon" }))).toBeNull();
  });
});

describe("session cookie payload", () => {
  it("round-trips", () => {
    expect(parseSession(serializeSession(validSession))).toEqual(validSession);
  });

  it("rejects a missing cookie", () => {
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession(null)).toBeNull();
    expect(parseSession("")).toBeNull();
  });

  it("rejects malformed JSON", () => {
    expect(parseSession("{not json")).toBeNull();
  });

  it("rejects a payload with no token", () => {
    expect(parseSession(JSON.stringify({ ...validSession, accessToken: "" }))).toBeNull();
  });

  it("rejects a payload with an unusable role", () => {
    expect(parseSession(JSON.stringify({ ...validSession, role: "wizard" }))).toBeNull();
  });

  it("rejects a payload missing required fields", () => {
    expect(parseSession(JSON.stringify({ accessToken: "x" }))).toBeNull();
  });
});

describe("cookie options", () => {
  const now = new Date("2026-09-09T11:00:00Z");

  it("is HTTP-only, lax and path-scoped to the whole site", () => {
    const options = sessionCookieOptions("2026-09-09T12:00:00Z", now);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("derives max-age from the backend's own expires_at", () => {
    expect(sessionCookieOptions("2026-09-09T12:00:00Z", now).maxAge).toBe(3600);
  });

  it("never produces a negative max-age for an already-expired token", () => {
    expect(sessionCookieOptions("2026-09-09T10:00:00Z", now).maxAge).toBe(0);
  });

  it("produces a zero max-age for an unparseable expiry", () => {
    expect(sessionCookieOptions("nonsense", now).maxAge).toBe(0);
  });
});
