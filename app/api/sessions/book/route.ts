import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "~/lib/api/errors";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { bookSession, MAX_SESSION_MINUTES, MIN_SESSION_MINUTES } from "~/lib/api/sessions";
import { requireSession } from "~/lib/auth/session";

/** Mirrors the backend's `BookTutoringSessionRequest` bounds. */
const bookBodySchema = z.object({
  tutor_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  scheduled_at: z.string().min(1),
  duration_minutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await parseJsonBody(request, bookBodySchema);

    const scheduledAt = new Date(body.scheduled_at);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new ApiError("validation", "That date and time could not be understood.", {
        status: 400,
      });
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new ApiError("validation", "Choose a date and time in the future.", { status: 400 });
    }

    const booking = await bookSession(session.accessToken, {
      tutorId: body.tutor_id,
      subjectId: body.subject_id,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: body.duration_minutes,
    });

    return NextResponse.json(booking);
  } catch (error) {
    return errorResponse(error);
  }
}
