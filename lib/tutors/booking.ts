import {
  DEFAULT_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
  MIN_SESSION_MINUTES,
} from "~/lib/api/sessions";
import type { BookableSubject } from "./subject-matching";

/**
 * Booking form validation.
 *
 * Pure so the rules can be tested without driving the dialog. Bounds mirror
 * the backend's `BookTutoringSessionRequest` exactly - the frontend never
 * offers a duration the API would reject.
 */

export type BookingDraft = {
  subjectId: number | null;
  /** `YYYY-MM-DD` from an `<input type="date">`. */
  date: string;
  /** `HH:MM` from an `<input type="time">`. */
  time: string;
  durationMinutes: number;
};

export type BookingErrors = Partial<Record<keyof BookingDraft, string>>;

export type BookingValidation =
  | { ok: true; scheduledAt: string; subject: BookableSubject }
  | { ok: false; errors: BookingErrors };

export function emptyBookingDraft(): BookingDraft {
  return {
    subjectId: null,
    date: "",
    time: "",
    durationMinutes: DEFAULT_SESSION_MINUTES,
  };
}

/** Combines the two inputs into a local-time instant. Null when unparseable. */
export function combineDateTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hours > 23 || minutes > 59) return null;

  const combined = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Rejects impossible calendar dates such as 2026-02-30, which Date rolls over.
  if (
    combined.getFullYear() !== year ||
    combined.getMonth() !== month - 1 ||
    combined.getDate() !== day
  ) {
    return null;
  }

  return combined;
}

/** `min` attribute for the date input: today, in local time. */
export function minBookingDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function validateBooking(
  draft: BookingDraft,
  options: { subjects: readonly BookableSubject[]; now?: Date },
): BookingValidation {
  const now = options.now ?? new Date();
  const errors: BookingErrors = {};

  const subject =
    draft.subjectId === null
      ? undefined
      : options.subjects.find((item) => item.id === draft.subjectId);

  if (!subject) errors.subjectId = "Choose a subject for this session.";
  if (!draft.date) errors.date = "Choose a date.";
  if (!draft.time) errors.time = "Choose a start time.";

  if (
    !Number.isInteger(draft.durationMinutes) ||
    draft.durationMinutes < MIN_SESSION_MINUTES ||
    draft.durationMinutes > MAX_SESSION_MINUTES
  ) {
    errors.durationMinutes = `Choose a length between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes.`;
  }

  if (draft.date && draft.time) {
    const scheduled = combineDateTime(draft.date, draft.time);

    if (!scheduled) {
      errors.date = "That date and time is not valid.";
    } else if (scheduled.getTime() <= now.getTime()) {
      errors.time = "Choose a date and time in the future.";
    } else if (Object.keys(errors).length === 0 && subject) {
      return { ok: true, scheduledAt: scheduled.toISOString(), subject };
    }
  }

  return { ok: false, errors };
}
