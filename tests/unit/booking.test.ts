import { describe, expect, it } from "vitest";

import { MAX_SESSION_MINUTES, SESSION_DURATION_OPTIONS } from "~/lib/api/sessions";
import {
  combineDateTime,
  emptyBookingDraft,
  minBookingDate,
  validateBooking,
} from "~/lib/tutors/booking";

const subjects = [
  { id: 6, name: "Physics" },
  { id: 4, name: "Chemistry" },
];

const now = new Date("2026-09-09T10:00:00");

describe("combineDateTime", () => {
  it("combines a date and a time", () => {
    const combined = combineDateTime("2026-09-20", "16:30");

    expect(combined?.getFullYear()).toBe(2026);
    expect(combined?.getMonth()).toBe(8);
    expect(combined?.getDate()).toBe(20);
    expect(combined?.getHours()).toBe(16);
    expect(combined?.getMinutes()).toBe(30);
  });

  it("rejects malformed input", () => {
    expect(combineDateTime("20-09-2026", "16:30")).toBeNull();
    expect(combineDateTime("2026-09-20", "4pm")).toBeNull();
    expect(combineDateTime("", "")).toBeNull();
  });

  it("rejects an out-of-range time", () => {
    expect(combineDateTime("2026-09-20", "25:00")).toBeNull();
    expect(combineDateTime("2026-09-20", "12:99")).toBeNull();
  });

  it("rejects a calendar date that does not exist instead of rolling it over", () => {
    expect(combineDateTime("2026-02-30", "10:00")).toBeNull();
    expect(combineDateTime("2026-13-01", "10:00")).toBeNull();
  });

  it("accepts 29 February in a leap year", () => {
    expect(combineDateTime("2028-02-29", "10:00")).not.toBeNull();
  });
});

describe("minBookingDate", () => {
  it("is today, zero-padded", () => {
    expect(minBookingDate(new Date("2026-01-05T10:00:00"))).toBe("2026-01-05");
  });
});

describe("booking validation", () => {
  it("accepts a complete, future booking", () => {
    const result = validateBooking(
      { subjectId: 6, date: "2026-09-20", time: "16:00", durationMinutes: 60 },
      { subjects, now },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subject).toEqual({ id: 6, name: "Physics" });
      expect(new Date(result.scheduledAt).getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it("requires a subject", () => {
    const result = validateBooking(
      { subjectId: null, date: "2026-09-20", time: "16:00", durationMinutes: 60 },
      { subjects, now },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.subjectId).toBeTruthy();
  });

  it("rejects a subject id that is not one of the tutor's bookable subjects", () => {
    const result = validateBooking(
      { subjectId: 999, date: "2026-09-20", time: "16:00", durationMinutes: 60 },
      { subjects, now },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.subjectId).toBeTruthy();
  });

  it("requires a date and a time", () => {
    const result = validateBooking(
      { subjectId: 6, date: "", time: "", durationMinutes: 60 },
      { subjects, now },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.date).toBeTruthy();
      expect(result.errors.time).toBeTruthy();
    }
  });

  it("rejects a time in the past", () => {
    const result = validateBooking(
      { subjectId: 6, date: "2026-09-09", time: "09:00", durationMinutes: 60 },
      { subjects, now },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.time).toMatch(/future/i);
  });

  it("rejects a duration above the backend's maximum", () => {
    const result = validateBooking(
      { subjectId: 6, date: "2026-09-20", time: "16:00", durationMinutes: MAX_SESSION_MINUTES + 1 },
      { subjects, now },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.durationMinutes).toBeTruthy();
  });

  it("rejects a zero or negative duration", () => {
    for (const durationMinutes of [0, -30]) {
      const result = validateBooking(
        { subjectId: 6, date: "2026-09-20", time: "16:00", durationMinutes },
        { subjects, now },
      );

      expect(result.ok).toBe(false);
    }
  });

  it("accepts the backend's maximum duration", () => {
    const result = validateBooking(
      { subjectId: 6, date: "2026-09-20", time: "16:00", durationMinutes: MAX_SESSION_MINUTES },
      { subjects, now },
    );

    expect(result.ok).toBe(true);
  });

  it("only ever offers durations the backend accepts", () => {
    for (const minutes of SESSION_DURATION_OPTIONS) {
      expect(minutes).toBeGreaterThan(0);
      expect(minutes).toBeLessThanOrEqual(MAX_SESSION_MINUTES);
    }
  });

  it("starts from an empty draft with the backend's default duration", () => {
    const draft = emptyBookingDraft();

    expect(draft.subjectId).toBeNull();
    expect(draft.durationMinutes).toBe(60);
  });
});
