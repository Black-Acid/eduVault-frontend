import { z } from "zod";

import type { SubmitPaperResponse } from "~/lib/api/schemas";

/**
 * The AI-review queue: which wrong answers from the latest attempt the student
 * has not read an explanation for yet.
 *
 * The backend does not persist review-resolution state, so this is
 * session-scoped frontend state. It is written and mutated *only* by server
 * route handlers into an HTTP-only cookie - the previous build wrote it with
 * `document.cookie`, which let the browser choose which attempt got explained.
 *
 * This queue is a convenience, not an authorisation boundary: `POST /ai/explain`
 * independently verifies that the attempt belongs to the caller.
 */

export const reviewQueueItemSchema = z.object({
  attempt_id: z.number().int().positive(),
  question_id: z.number().int().positive(),
  is_resolved: z.boolean(),
});

export const reviewQueueSchema = z.array(reviewQueueItemSchema);

export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;

/** Two hours, matching the practical lifetime of a quiz-review sitting. */
export const REVIEW_QUEUE_MAX_AGE_SECONDS = 60 * 60 * 2;

/**
 * Builds the queue from the backend's own `wrong_questions`.
 *
 * Note that unanswered questions are counted in `wrong` but never appear in
 * `wrong_questions`, so they cannot be explained. See
 * docs/BACKEND_CONTRACT_GAPS.md.
 */
export function buildReviewQueue(result: SubmitPaperResponse): ReviewQueueItem[] {
  return result.wrong_questions.map((item) => ({
    attempt_id: result.attempt_id,
    question_id: item.question_id,
    is_resolved: false,
  }));
}

export function parseReviewQueue(raw: string | undefined | null): ReviewQueueItem[] {
  if (!raw) return [];

  try {
    const parsed = reviewQueueSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function serializeReviewQueue(queue: ReviewQueueItem[]): string {
  return JSON.stringify(queue);
}

export function markResolved(
  queue: ReviewQueueItem[],
  attemptId: number,
  questionId: number,
): ReviewQueueItem[] {
  return queue.map((item) =>
    item.attempt_id === attemptId && item.question_id === questionId
      ? { ...item, is_resolved: true }
      : item,
  );
}

export function unresolvedItems(queue: ReviewQueueItem[]): ReviewQueueItem[] {
  return queue.filter((item) => !item.is_resolved);
}

export function reviewQueueCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REVIEW_QUEUE_MAX_AGE_SECONDS,
  };
}
