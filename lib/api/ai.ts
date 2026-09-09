import { apiFetch } from "./client";
import { AI_TIMEOUT_MS } from "./config";
import { aiExplanationSchema, type AiExplanation } from "./schemas";

/**
 * `POST /ai/explain` - protected.
 *
 * The backend verifies that `attempt_id` belongs to the caller and that the
 * question was actually answered incorrectly in that attempt, so a tampered
 * client-side queue cannot unlock somebody else's explanation.
 *
 * Gemini responses are slow: this uses the extended AI timeout.
 */
export async function explainWrongAnswer(
  token: string,
  attemptId: number,
  questionId: number,
): Promise<AiExplanation> {
  return apiFetch("/ai/explain", {
    method: "POST",
    token,
    schema: aiExplanationSchema,
    timeoutMs: AI_TIMEOUT_MS,
    body: { attempt_id: attemptId, question_id: questionId },
  });
}
