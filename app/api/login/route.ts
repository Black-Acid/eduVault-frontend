import { NextResponse } from "next/server";
import { z } from "zod";

import { login } from "~/lib/api/auth";
import { ApiError } from "~/lib/api/errors";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { homePathForRole } from "~/lib/auth/roles";
import { sessionFromAuthResponse, setSessionCookie } from "~/lib/auth/session";

const loginBodySchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Exchanges credentials for an HTTP-only session cookie.
 *
 * The access token is deliberately NOT returned in the response body: the
 * browser receives only where to navigate next.
 */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, loginBodySchema);
    const auth = await login({ email: body.email, password: body.password });
    const session = sessionFromAuthResponse(auth);

    if (!session) {
      throw new ApiError(
        "contract",
        "The backend returned an account with an unrecognised role or expiry.",
      );
    }

    const response = NextResponse.json({
      name: session.name,
      role: session.role,
      redirectTo: homePathForRole(session.role),
    });

    setSessionCookie(response, session);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
