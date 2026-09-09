import { NextResponse } from "next/server";

import { ApiError } from "~/lib/api/errors";
import { errorResponse } from "~/lib/api/route-helpers";
import { joinSession } from "~/lib/api/sessions";
import { requireSession } from "~/lib/auth/session";
import { isSafeExternalUrl } from "~/lib/format";
import { parseId } from "~/lib/quiz/selection";

/**
 * Protected join flow.
 *
 * The client never opens `session.meeting_url` from the session list. It asks
 * for a join here, and the backend re-verifies that the session belongs to the
 * caller and is LIVE before handing back a URL.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireSession();
    const { sessionId } = await context.params;
    const parsedId = parseId(sessionId);

    if (parsedId === null) {
      throw new ApiError("validation", "That session reference is not valid.", { status: 400 });
    }

    const result = await joinSession(session.accessToken, parsedId);

    if (!isSafeExternalUrl(result.meeting_url)) {
      throw new ApiError("contract", "The meeting link returned by EduVault was not usable.");
    }

    return NextResponse.json({
      session_id: result.session_id,
      meeting_url: result.meeting_url,
      status: result.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
