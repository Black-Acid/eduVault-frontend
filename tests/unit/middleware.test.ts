import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "~/middleware";
import { SESSION_COOKIE, serializeSession, type Session } from "~/lib/auth/session";

/**
 * Middleware is navigation protection, not authorisation - the backend
 * authorises every protected call from the bearer token. These tests cover the
 * routing contract and, importantly, that an expired session is torn down
 * rather than left to produce a wall of 401s.
 */

const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function session(overrides: Partial<Session> = {}): Session {
  return {
    userId: 1,
    name: "Ama Serwaa",
    email: "ama@example.com",
    role: "student",
    accessToken: "token-value",
    expiresAt: FUTURE,
    ...overrides,
  };
}

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(new URL(path, "https://eduvault.test"), {
    headers: cookie ? { cookie } : undefined,
  });
}

function sessionCookie(value: Session): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(serializeSession(value))}`;
}

function locationOf(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname + new URL(location).search : null;
}

describe("unauthenticated visitors", () => {
  it("may see the landing page", () => {
    expect(locationOf(middleware(request("/")))).toBeNull();
  });

  it("may see login and signup", () => {
    expect(locationOf(middleware(request("/login")))).toBeNull();
    expect(locationOf(middleware(request("/signup")))).toBeNull();
  });

  it("is sent to login from a protected route, with a return path", () => {
    expect(locationOf(middleware(request("/student")))).toBe("/login?returnTo=%2Fstudent");
  });

  it("preserves the query string in the return path", () => {
    expect(locationOf(middleware(request("/student?year=2026&month=8")))).toBe(
      "/login?returnTo=%2Fstudent%3Fyear%3D2026%26month%3D8",
    );
  });

  it("is sent to login from the tutor area", () => {
    expect(locationOf(middleware(request("/tutor")))).toBe("/login?returnTo=%2Ftutor");
  });
});

describe("expired and malformed sessions", () => {
  it("redirects to login and clears the cookie", () => {
    const response = middleware(request("/student", sessionCookie(session({ expiresAt: PAST }))));

    expect(locationOf(response)).toBe("/login?returnTo=%2Fstudent");
    expect(response.headers.getSetCookie().join(";")).toContain(SESSION_COOKIE);
  });

  it("clears a malformed cookie rather than looping", () => {
    const response = middleware(request("/student", `${SESSION_COOKIE}=not-json`));
    expect(locationOf(response)).toBe("/login?returnTo=%2Fstudent");
  });

  it("clears an expired cookie on a public page without redirecting", () => {
    const response = middleware(request("/login", sessionCookie(session({ expiresAt: PAST }))));

    expect(locationOf(response)).toBeNull();
    expect(response.headers.getSetCookie().join(";")).toContain(SESSION_COOKIE);
  });

  it("does not redirect a request that is already on /login", () => {
    const response = middleware(request("/login", `${SESSION_COOKIE}=garbage`));
    expect(locationOf(response)).toBeNull();
  });
});

describe("signed-in students", () => {
  const cookie = sessionCookie(session());

  it("reaches the student area", () => {
    expect(locationOf(middleware(request("/student", cookie)))).toBeNull();
    expect(locationOf(middleware(request("/student/play-quiz", cookie)))).toBeNull();
  });

  it("is redirected away from the landing and auth pages", () => {
    expect(locationOf(middleware(request("/", cookie)))).toBe("/student");
    expect(locationOf(middleware(request("/login", cookie)))).toBe("/student");
    expect(locationOf(middleware(request("/signup", cookie)))).toBe("/student");
  });

  it("cannot reach the tutor area", () => {
    expect(locationOf(middleware(request("/tutor", cookie)))).toBe("/student");
  });
});

describe("signed-in teachers", () => {
  const cookie = sessionCookie(session({ role: "teacher" }));

  it("is sent to /tutor from the landing page", () => {
    expect(locationOf(middleware(request("/", cookie)))).toBe("/tutor");
  });

  it("reaches the tutor area", () => {
    expect(locationOf(middleware(request("/tutor", cookie)))).toBeNull();
  });

  it("cannot reach the student area", () => {
    expect(locationOf(middleware(request("/student", cookie)))).toBe("/tutor");
  });
});

describe("legacy tutor accounts", () => {
  it("routes a stored 'tutor' role to the tutor area rather than locking the user out", () => {
    const raw = JSON.stringify({ ...session(), role: "tutor" });
    const cookie = `${SESSION_COOKIE}=${encodeURIComponent(raw)}`;

    expect(locationOf(middleware(request("/tutor", cookie)))).toBeNull();
    expect(locationOf(middleware(request("/", cookie)))).toBe("/tutor");
  });
});
