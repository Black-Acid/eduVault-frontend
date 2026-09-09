/**
 * Month arithmetic for the dashboard's activity calendar.
 *
 * The backend returns activity for exactly one month per request, so month
 * navigation has to be a server round-trip driven by `?year=&month=` rather
 * than local state - otherwise "previous month" renders an all-zero grid that
 * looks like a month with no study activity.
 */

export type YearMonth = {
  year: number;
  /** 1-12. */
  month: number;
};

/** EduVault has no data before this; anything earlier is a malformed URL. */
export const MIN_YEAR = 2020;

/** Generous upper bound so a clock skew never traps the user. */
export const MAX_YEAR = 2100;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function currentYearMonth(now: Date = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function isValidYearMonth(value: Partial<YearMonth>): value is YearMonth {
  const { year, month } = value;

  return (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    typeof month === "number" &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

function parseIntParam(value: string | string[] | undefined | null): number | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;

  return Number(trimmed);
}

/**
 * Validates `?year=&month=`, falling back to the current month.
 *
 * Anything out of range - month 0, month 13, a year before EduVault existed,
 * a future month - resolves to the current month rather than being forwarded
 * to the backend.
 */
export function resolveYearMonth(
  rawYear: string | string[] | undefined | null,
  rawMonth: string | string[] | undefined | null,
  now: Date = new Date(),
): YearMonth {
  const fallback = currentYearMonth(now);

  const year = parseIntParam(rawYear);
  const month = parseIntParam(rawMonth);

  if (year === null || month === null) return fallback;

  const candidate = { year, month };
  if (!isValidYearMonth(candidate)) return fallback;
  if (isAfter(candidate, fallback)) return fallback;

  return candidate;
}

/** Adds `offset` months, rolling the year over correctly in both directions. */
export function shiftMonth(value: YearMonth, offset: number): YearMonth {
  const zeroBased = value.year * 12 + (value.month - 1) + offset;

  return {
    year: Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}

export function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

export function isAfter(a: YearMonth, b: YearMonth): boolean {
  if (a.year !== b.year) return a.year > b.year;
  return a.month > b.month;
}

export function monthLabel(value: YearMonth): string {
  return `${MONTH_NAMES[value.month - 1]} ${value.year}`;
}

export function shortMonthLabel(value: YearMonth): string {
  return `${MONTH_SHORT_NAMES[value.month - 1]} ${value.year}`;
}

/** Number of days in the month. Leap years included. */
export function daysInMonth(value: YearMonth): number {
  return new Date(Date.UTC(value.year, value.month, 0)).getUTCDate();
}

/** Weekday (0 = Sunday) of the 1st, computed in UTC to match the backend's dates. */
export function firstWeekdayOfMonth(value: YearMonth): number {
  return new Date(Date.UTC(value.year, value.month - 1, 1)).getUTCDay();
}

/** `YYYY-MM-DD` for a day of the month, matching the backend's `ActivityDay.date`. */
export function isoDate(value: YearMonth, day: number): string {
  const month = String(value.month).padStart(2, "0");
  return `${value.year}-${month}-${String(day).padStart(2, "0")}`;
}

/** Dashboard URL for a given month. */
export function buildDashboardHref(value: YearMonth): string {
  const params = new URLSearchParams({
    year: String(value.year),
    month: String(value.month),
  });

  return `/student?${params.toString()}`;
}
