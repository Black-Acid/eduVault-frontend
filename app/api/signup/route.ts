import { NextResponse } from "next/server";
import { z } from "zod";

import { signup } from "~/lib/api/auth";
import { ApiError } from "~/lib/api/errors";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { homePathForRole } from "~/lib/auth/roles";
import { sessionFromAuthResponse, setSessionCookie } from "~/lib/auth/session";

/**
 * Only the two roles the backend can actually provision are accepted. Sending
 * `tutor` would create a User with no TeacherProfile - an account that can
 * never be discovered or booked.
 */
const signupBodySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().min(3, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request, signupBodySchema);
    const auth = await signup(body);
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
