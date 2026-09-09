import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "~/lib/api/errors";
import { errorResponse, parseJsonBody } from "~/lib/api/route-helpers";
import { REVIEW_QUEUE_COOKIE, requireSession } from "~/lib/auth/session";
import {
  markResolved,
  parseReviewQueue,
  reviewQueueCookieOptions,
  serializeReviewQueue,
  unresolvedItems,
} from "~/lib/quiz/review-queue";

const resolveBodySchema = z.object({
  attempt_id: z.number().int().positive(),
  question_id: z.number().int().positive(),
});

/**
 * Marks one queue entry as reviewed.
 *
 * The queue lives in an HTTP-only cookie written only by the server, so the
 * client can advance through it but cannot fabricate entries for an attempt
 * that is not theirs.
 */
export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await parseJsonBody(request, resolveBodySchema);

    const store = await cookies();
    const queue = parseReviewQueue(store.get(REVIEW_QUEUE_COOKIE)?.value);

    if (queue.length === 0) {
      throw new ApiError("not_found", "There is no AI review queue for this session.", {
        status: 404,
      });
    }

    const exists = queue.some(
      (item) => item.attempt_id === body.attempt_id && item.question_id === body.question_id,
    );

    if (!exists) {
      throw new ApiError("not_found", "That question is not in your review queue.", {
        status: 404,
      });
    }

    const updated = markResolved(queue, body.attempt_id, body.question_id);

    const response = NextResponse.json({
      remaining: unresolvedItems(updated).length,
    });

    response.cookies.set(
      REVIEW_QUEUE_COOKIE,
      serializeReviewQueue(updated),
      reviewQueueCookieOptions(),
    );

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
