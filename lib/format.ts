/**
 * Shared display formatters.
 *
 * Every one of these takes a real backend value. None of them invents a
 * fallback figure: where a value is genuinely unavailable they return the
 * `UNAVAILABLE` dash so the UI can say so honestly.
 */

/** Rendered when the backend has no value for a metric (null, not zero). */
export const UNAVAILABLE = "—";

export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return UNAVAILABLE;
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return UNAVAILABLE;
  return new Intl.NumberFormat("en-GH").format(value);
}

/** Session fees are quoted in Ghana cedis by the backend. */
export function formatCurrencyGHS(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return UNAVAILABLE;

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * `null` means "the backend does not track this yet" and must not render as
 * `0m`. Zero renders as `0m` because that is a real, measured value.
 */
export function formatDurationMinutes(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return UNAVAILABLE;
  if (value < 0) return UNAVAILABLE;

  const total = Math.round(value);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return UNAVAILABLE;

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return UNAVAILABLE;

  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return UNAVAILABLE;

  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Initials derived from the backend's `full_name`. Never hard-coded, and
 * degrades to a single glyph rather than throwing on odd input.
 */
export function initialsFromName(name: string | null | undefined): string {
  if (!name) return "?";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => /\p{L}|\p{N}/u.test(part));

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatRating(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "Not yet rated";
  return `${rating.toFixed(1)} / 5.0`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/**
 * Only http(s) URLs are ever opened. Guards against a malformed or hostile
 * `meeting_url` reaching an anchor.
 */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
