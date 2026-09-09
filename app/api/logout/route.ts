import { NextResponse } from "next/server";

import { clearSessionCookies } from "~/lib/auth/session";

/** Clears the session cookie, the legacy `data` cookie and the AI-review queue. */
export async function POST() {
  const response = NextResponse.json({ message: "Signed out" });
  clearSessionCookies(response);
  return response;
}
