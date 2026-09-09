import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { ApiError } from "~/lib/api/errors";
import type { AuthResponse } from "~/lib/api/schemas";
import { normalizeRole, type UserRole } from "./roles";

/**
 * Server-side session handling.
 *
 * The bearer token lives in a single HTTP-only cookie and is read only by
 * server components and route handlers. It is never serialised into a page,
 * never handed to client JavaScript, and never logged.
 */

export const SESSION_COOKIE = "eduvault_session";

/**
 * The pre-BFF build stored the raw auth payload in a cookie named `data`.
 * We clear it on logout and ignore it everywhere else so stale copies of a
 * token cannot linger in a browser.
 */
export const LEGACY_SESSION_COOKIE = "data";

/** Cookie holding the AI-review queue. Server-written only. */
export const REVIEW_QUEUE_COOKIE = "eduvault_review_queue";

export type Session = {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  accessToken: string;
  /** ISO-8601, always normalised to an absolute instant. */
  expiresAt: string;
};

type StoredSession = {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  accessToken: string;
  expiresAt: string;
};

/**
 * Parses the backend `expires_at`. The backend emits a timezone-aware UTC ISO
 * string; if a naive value ever appears we treat it as UTC rather than letting
 * the server's local timezone silently shift the expiry.
 */
export function parseExpiry(value: string): Date | null {
  if (!value) return null;

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  const candidate = hasZone ? value.trim() : `${value.trim()}Z`;
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expiry = parseExpiry(expiresAt);
  // An unparseable expiry is treated as expired: failing closed is correct here.
  if (!expiry) return true;
  return expiry.getTime() <= now.getTime();
}

/** Builds the session payload from a validated backend auth response. */
export function sessionFromAuthResponse(auth: AuthResponse): Session | null {
  const role = normalizeRole(auth.role);
  if (!role) return null;

  const expiry = parseExpiry(auth.expires_at);
  if (!expiry) return null;

  return {
    userId: auth.id,
    name: auth.name,
    email: auth.email,
    role,
    accessToken: auth.access_token,
    expiresAt: expiry.toISOString(),
  };
}

export function serializeSession(session: Session): string {
  return JSON.stringify(session satisfies StoredSession);
}

export function parseSession(raw: string | undefined | null): Session | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    const role = normalizeRole(parsed.role);

    if (
      typeof parsed.userId !== "number" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      !parsed.accessToken ||
      !role
    ) {
      return null;
    }

    return {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      role,
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

/**
 * Cookie lifetime follows the backend's own `expires_at` rather than a fixed
 * guess, so the cookie and the token stop being valid at the same moment.
 */
export function sessionCookieOptions(
  expiresAt: string,
  now: Date = new Date(),
): SessionCookieOptions {
  const expiry = parseExpiry(expiresAt);
  const seconds = expiry ? Math.floor((expiry.getTime() - now.getTime()) / 1000) : 0;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, seconds),
  };
}

/** Reads the current session, returning null when absent, malformed or expired. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const session = parseSession(store.get(SESSION_COOKIE)?.value);

  if (!session) return null;
  if (isExpired(session.expiresAt)) return null;

  return session;
}

/**
 * Session or bust. Callers in server components/route handlers use this so a
 * missing session surfaces as a normal `unauthorized` ApiError.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new ApiError("unauthorized", "You need to log in to continue.", { status: 401 });
  }

  return session;
}

export function setSessionCookie(response: NextResponse, session: Session): void {
  response.cookies.set(SESSION_COOKIE, serializeSession(session), {
    ...sessionCookieOptions(session.expiresAt),
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_SESSION_COOKIE);
  response.cookies.delete(REVIEW_QUEUE_COOKIE);
}
