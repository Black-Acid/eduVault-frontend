import { describe, expect, it } from "vitest";

import {
  buildDashboardHref,
  currentYearMonth,
  daysInMonth,
  firstWeekdayOfMonth,
  isAfter,
  isoDate,
  isSameMonth,
  isValidYearMonth,
  monthLabel,
  resolveYearMonth,
  shiftMonth,
} from "~/lib/date/month";

describe("month arithmetic", () => {
  it("rolls back from January to December of the previous year", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("rolls forward from December to January of the next year", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("shifts within a year", () => {
    expect(shiftMonth({ year: 2026, month: 9 }, -1)).toEqual({ year: 2026, month: 8 });
    expect(shiftMonth({ year: 2026, month: 9 }, 1)).toEqual({ year: 2026, month: 10 });
  });

  it("handles multi-month shifts across a year boundary", () => {
    expect(shiftMonth({ year: 2026, month: 2 }, -14)).toEqual({ year: 2024, month: 12 });
  });

  it("compares months", () => {
    expect(isSameMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(isAfter({ year: 2026, month: 10 }, { year: 2026, month: 9 })).toBe(true);
    expect(isAfter({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBe(false);
  });
});

describe("days in month", () => {
  it("handles a 31-day month", () => {
    expect(daysInMonth({ year: 2026, month: 1 })).toBe(31);
  });

  it("handles a 30-day month", () => {
    expect(daysInMonth({ year: 2026, month: 9 })).toBe(30);
  });

  it("handles February in a common year", () => {
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
  });

  it("handles February in a leap year", () => {
    expect(daysInMonth({ year: 2024, month: 2 })).toBe(29);
  });

  it("handles February in a century leap year", () => {
    expect(daysInMonth({ year: 2000, month: 2 })).toBe(29);
  });

  it("computes the first weekday in UTC", () => {
    // 1 September 2026 is a Tuesday.
    expect(firstWeekdayOfMonth({ year: 2026, month: 9 })).toBe(2);
  });

  it("formats an ISO date that matches the backend's ActivityDay.date", () => {
    expect(isoDate({ year: 2026, month: 9 }, 3)).toBe("2026-09-03");
    expect(isoDate({ year: 2026, month: 12 }, 25)).toBe("2026-12-25");
  });
});

describe("month validation", () => {
  it("accepts a valid year and month", () => {
    expect(isValidYearMonth({ year: 2026, month: 12 })).toBe(true);
  });

  it("rejects month 0 and month 13", () => {
    expect(isValidYearMonth({ year: 2026, month: 0 })).toBe(false);
    expect(isValidYearMonth({ year: 2026, month: 13 })).toBe(false);
  });

  it("rejects a year before EduVault existed and one absurdly far ahead", () => {
    expect(isValidYearMonth({ year: 1999, month: 6 })).toBe(false);
    expect(isValidYearMonth({ year: 9999, month: 6 })).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidYearMonth({ year: 2026.5, month: 6 })).toBe(false);
    expect(isValidYearMonth({ year: 2026, month: 6.5 })).toBe(false);
  });
});

describe("resolveYearMonth", () => {
  const now = new Date("2026-09-09T10:00:00Z");
  const current = { year: now.getFullYear(), month: now.getMonth() + 1 };

  it("uses valid query parameters", () => {
    expect(resolveYearMonth("2026", "3", now)).toEqual({ year: 2026, month: 3 });
  });

  it("falls back to the current month when parameters are absent", () => {
    expect(resolveYearMonth(undefined, undefined, now)).toEqual(current);
  });

  it("falls back for an out-of-range month", () => {
    expect(resolveYearMonth("2026", "13", now)).toEqual(current);
    expect(resolveYearMonth("2026", "0", now)).toEqual(current);
  });

  it("falls back for non-numeric input", () => {
    expect(resolveYearMonth("september", "nine", now)).toEqual(current);
    expect(resolveYearMonth("2026", "-3", now)).toEqual(current);
  });

  it("falls back for a partially supplied pair", () => {
    expect(resolveYearMonth("2026", undefined, now)).toEqual(current);
  });

  it("never resolves to a future month", () => {
    expect(resolveYearMonth("2027", "1", now)).toEqual(current);
  });

  it("allows a past month within range", () => {
    expect(resolveYearMonth("2025", "12", now)).toEqual({ year: 2025, month: 12 });
  });

  it("is not pinned to any hard-coded month", () => {
    const other = new Date("2027-02-15T00:00:00Z");
    expect(resolveYearMonth(undefined, undefined, other)).toEqual({ year: 2027, month: 2 });
  });
});

describe("labels and links", () => {
  it("labels a month", () => {
    expect(monthLabel({ year: 2026, month: 9 })).toBe("September 2026");
  });

  it("builds an encoded dashboard href", () => {
    expect(buildDashboardHref({ year: 2026, month: 1 })).toBe("/student?year=2026&month=1");
  });

  it("derives the current month from the supplied clock", () => {
    expect(currentYearMonth(new Date("2026-01-31T23:00:00"))).toEqual({ year: 2026, month: 1 });
  });
});
