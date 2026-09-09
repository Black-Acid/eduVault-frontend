import { NextResponse } from "next/server";
import { z } from "zod";

import { submitPaper } from "~/lib/api/quizzes";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { REVIEW_QUEUE_COOKIE, requireSession } from "~/lib/auth/session";
import {
  buildReviewQueue,
  reviewQueueCookieOptions,
  serializeReviewQueue,
} from "~/lib/quiz/review-queue";

/**
 * `selected_option_id` is a required int on the backend, so the client only
 * ever sends questions it has an answer for. Unanswered questions are omitted
 * rather than sent as null or with a fabricated option id.
 */
const submitQuizBodySchema = z.object({
  paper_id: z.number().int().positive(),
  answers: z
    .array(
      z.object({
        question_id: z.number().int().positive(),
        selected_option_id: z.number().int().positive(),
      }),
    )
    .max(500),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await parseJsonBody(request, submitQuizBodySchema);

    const result = await submitPaper(session.accessToken, body.paper_id, body.answers);

    const response = NextResponse.json(result);

    // The AI-review queue is derived from the backend's own wrong_questions and
    // written server-side into an HTTP-only cookie, so the browser cannot
    // choose which attempt gets explained.
    response.cookies.set(
      REVIEW_QUEUE_COOKIE,
      serializeReviewQueue(buildReviewQueue(result)),
      reviewQueueCookieOptions(),
    );

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
