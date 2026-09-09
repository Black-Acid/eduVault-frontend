import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { homePathForRole } from "~/lib/auth/roles";
import {
  isExpired,
  LEGACY_SESSION_COOKIE,
  parseSession,
  REVIEW_QUEUE_COOKIE,
  SESSION_COOKIE,
} from "~/lib/auth/session";

/**
 * Navigation guard.
 *
 * This is *not* an authorisation boundary - the backend authorises every
 * protected call from the bearer token. Middleware only keeps users out of
 * routes that would be useless to them and, importantly, tears down sessions
 * whose token has already expired instead of letting them hit a wall of 401s.
 */

const PUBLIC_PATHS = ["/", "/login", "/signup"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

/** Redirect to login, clearing anything stale, with a safe return target. */
function redirectToLogin(request: NextRequest, withReturnTo: boolean): NextResponse {
  const url = new URL("/login", request.url);

  if (withReturnTo) {
    // Only ever a same-origin path, so this cannot be turned into an open redirect.
    const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (target && target !== "/login") url.searchParams.set("returnTo", target);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_SESSION_COOKIE);
  response.cookies.delete(REVIEW_QUEUE_COOKIE);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawSession = request.cookies.get(SESSION_COOKIE)?.value;
  const session = parseSession(rawSession);
  const hasStaleCookie = Boolean(rawSession) && !session;
  const sessionExpired = session ? isExpired(session.expiresAt) : false;

  // A cookie that is present but unusable is cleared once, so the user is not
  // bounced between routes by a session that can never authenticate.
  if (hasStaleCookie || sessionExpired) {
    if (isPublicPath(pathname)) {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.delete(LEGACY_SESSION_COOKIE);
      response.cookies.delete(REVIEW_QUEUE_COOKIE);
      return response;
    }

    return redirectToLogin(request, true);
  }

  if (!session) {
    if (isPublicPath(pathname)) return NextResponse.next();
    return redirectToLogin(request, true);
  }

  const home = homePathForRole(session.role);

  // Signed-in users have no use for the landing or auth pages.
  if (isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/student") && session.role !== "student") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/tutor") && session.role !== "teacher") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
