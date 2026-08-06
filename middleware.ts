import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the single 'data' cookie and parse its JSON content
  const dataCookie = request.cookies.get("data")?.value;

  let userRole = "";
  let token = "";

  if (dataCookie) {
    try {
      const parsedData = JSON.parse(dataCookie);
      token = parsedData.access_token || "";
      userRole = parsedData.role ? parsedData.role.toLowerCase().trim() : "";
    } catch (error) {
      console.error("Failed to parse data cookie:", error);
    }
  }

  const isAuthenticated = !!token;

  // 2. Define public routes that don't require authentication
  const isLandingPage = pathname === "/";
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  // If the user is not logged in
  if (!isAuthenticated) {
    if (isLandingPage || isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user IS logged in, prevent them from lingering on the landing page or auth pages
  if (isLandingPage || isAuthRoute) {
    if (userRole === "tutor") {
      return NextResponse.redirect(new URL("/tutor", request.url));
    }
    return NextResponse.redirect(new URL("/student", request.url));
  }

  // 3. Role-Based Route Protection
  if (pathname.startsWith("/tutor")) {
    if (userRole !== "tutor") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
  }

  if (pathname.startsWith("/student")) {
    if (userRole !== "student") {
      return NextResponse.redirect(new URL("/tutor", request.url));
    }
  }

  // 4. Quiz play protection: Accessible only to students
  if (pathname.includes("/quiz")) {
    if (userRole !== "student") {
      return NextResponse.redirect(new URL("/tutor", request.url));
    }
  }

  // 5. Messages route protection
  if (pathname.startsWith("/messages")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
