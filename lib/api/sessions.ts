import { apiFetch } from "./client";
import { COLD_START_TIMEOUT_MS } from "./config";
import {
  bookingResponseSchema,
  joinSessionResponseSchema,
  studentSessionListSchema,
  type BookingResponse,
  type JoinSessionResponse,
  type StudentSession,
} from "./schemas";

/** Backend bounds from `BookTutoringSessionRequest`. */
export const MIN_SESSION_MINUTES = 1;
export const MAX_SESSION_MINUTES = 240;
export const DEFAULT_SESSION_MINUTES = 60;

/** Durations offered in the booking form. All within the backend's bounds. */
export const SESSION_DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;

export type BookSessionInput = {
  tutorId: number;
  subjectId: number;
  /** ISO-8601 instant. */
  scheduledAt: string;
  durationMinutes: number;
};

/**
 * `POST /sessions/book` - protected.
 *
 * The student is taken from the token. Never retried: a replay would create a
 * duplicate booking and a duplicate tutor email.
 */
export async function bookSession(
  token: string,
  input: BookSessionInput,
): Promise<BookingResponse> {
  return apiFetch("/sessions/book", {
    method: "POST",
    token,
    schema: bookingResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    body: {
      tutor_id: input.tutorId,
      subject_id: input.subjectId,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
    },
  });
}

/** `GET /sessions/my-sessions` - protected, scoped to the authenticated student. */
export async function getMySessions(token: string): Promise<StudentSession[]> {
  return apiFetch("/sessions/my-sessions", {
    token,
    schema: studentSessionListSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    cache: "no-store",
  });
}

/**
 * `GET /sessions/{id}/join` - protected.
 *
 * The backend re-checks that the session belongs to the caller, that it is
 * LIVE and that a meeting URL exists. The frontend never opens
 * `session.meeting_url` directly, so ownership is always enforced server-side.
 */
export async function joinSession(
  token: string,
  sessionId: number,
): Promise<JoinSessionResponse> {
  return apiFetch(`/sessions/${sessionId}/join`, {
    token,
    schema: joinSessionResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    cache: "no-store",
  });
}
