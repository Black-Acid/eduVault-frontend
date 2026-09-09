import { apiFetch } from "./client";
import { COLD_START_TIMEOUT_MS } from "./config";
import {
  questionListSchema,
  submitPaperResponseSchema,
  type Question,
  type SubmitPaperResponse,
} from "./schemas";

export type FetchQuestionsInput = {
  subject: string;
  year: number;
  paperNumber: string;
};

/**
 * `POST /questions` - public.
 *
 * The three fields must come from a single backend Paper record; callers get
 * them from `resolvePaperSelection` rather than from raw query-string text.
 */
export async function getQuestions(input: FetchQuestionsInput): Promise<Question[]> {
  return apiFetch("/questions", {
    method: "POST",
    schema: questionListSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    body: {
      subject: input.subject,
      year: input.year,
      paper_number: input.paperNumber,
    },
  });
}

export type SubmittedAnswer = {
  question_id: number;
  selected_option_id: number;
};

/**
 * `POST /papers/submit` - protected.
 *
 * The backend schema requires `selected_option_id: int`, so unanswered
 * questions are *omitted* from the payload; we never invent an option id.
 * See docs/BACKEND_CONTRACT_GAPS.md for what the backend does with them.
 *
 * Never retried: a replay would create a duplicate QuizAttempt.
 */
export async function submitPaper(
  token: string,
  paperId: number,
  answers: SubmittedAnswer[],
): Promise<SubmitPaperResponse> {
  return apiFetch("/papers/submit", {
    method: "POST",
    token,
    schema: submitPaperResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    body: { paper_id: paperId, answers },
  });
}
