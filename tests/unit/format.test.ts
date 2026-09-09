import { describe, expect, it } from "vitest";

import {
  formatCurrencyGHS,
  formatDurationMinutes,
  formatNumber,
  formatPercent,
  formatRating,
  initialsFromName,
  isSafeExternalUrl,
  pluralize,
  UNAVAILABLE,
} from "~/lib/format";

describe("percentages", () => {
  it("formats a value", () => {
    expect(formatPercent(62.5)).toBe("63%");
    expect(formatPercent(62.5, 1)).toBe("62.5%");
  });

  it("formats a real zero as 0%", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("shows unavailable for null and undefined", () => {
    expect(formatPercent(null)).toBe(UNAVAILABLE);
    expect(formatPercent(undefined)).toBe(UNAVAILABLE);
  });
});

describe("durations", () => {
  it("distinguishes null from zero", () => {
    expect(formatDurationMinutes(null)).toBe(UNAVAILABLE);
    expect(formatDurationMinutes(0)).toBe("0m");
  });

  it("formats hours and minutes", () => {
    expect(formatDurationMinutes(45)).toBe("45m");
    expect(formatDurationMinutes(60)).toBe("1h");
    expect(formatDurationMinutes(135)).toBe("2h 15m");
    expect(formatDurationMinutes(1122)).toBe("18h 42m");
  });

  it("shows unavailable for a negative duration", () => {
    expect(formatDurationMinutes(-5)).toBe(UNAVAILABLE);
  });
});

describe("currency", () => {
  it("formats a session fee in Ghana cedis", () => {
    expect(formatCurrencyGHS(50)).toMatch(/50/);
    expect(formatCurrencyGHS(50)).toMatch(/(GH₵|GHS)/);
  });

  it("keeps the decimals of a fractional fee", () => {
    expect(formatCurrencyGHS(49.5)).toMatch(/49\.50/);
  });

  it("shows unavailable for a missing fee", () => {
    expect(formatCurrencyGHS(null)).toBe(UNAVAILABLE);
  });
});

describe("numbers", () => {
  it("formats a count", () => {
    expect(formatNumber(84)).toBe("84");
    expect(formatNumber(0)).toBe("0");
  });

  it("shows unavailable for null", () => {
    expect(formatNumber(null)).toBe(UNAVAILABLE);
  });
});

describe("initials", () => {
  it("derives initials from the first and last name", () => {
    expect(initialsFromName("Ama Mensah")).toBe("AM");
    expect(initialsFromName("Yaa Asantewaa Mensah")).toBe("YM");
  });

  it("handles a single name", () => {
    expect(initialsFromName("Kofi")).toBe("KO");
  });

  it("handles extra whitespace", () => {
    expect(initialsFromName("  kwame   nkrumah  ")).toBe("KN");
  });

  it("falls back for an empty or unusable name", () => {
    expect(initialsFromName("")).toBe("?");
    expect(initialsFromName(null)).toBe("?");
    expect(initialsFromName("   ")).toBe("?");
  });
});

describe("ratings", () => {
  it("formats a rating that has reviews", () => {
    expect(formatRating(4.5, 12)).toBe("4.5 / 5.0");
  });

  it("says so when there are no reviews, rather than showing 0.0 / 5.0", () => {
    expect(formatRating(0, 0)).toBe("Not yet rated");
  });
});

describe("pluralize", () => {
  it("uses the singular for one", () => {
    expect(pluralize(1, "paper")).toBe("paper");
    expect(pluralize(2, "paper")).toBe("papers");
    expect(pluralize(0, "paper")).toBe("papers");
  });
});

describe("external URL safety", () => {
  it("accepts http and https", () => {
    expect(isSafeExternalUrl("https://whereby.com/eduvault-abc")).toBe(true);
    expect(isSafeExternalUrl("http://example.com")).toBe(true);
  });

  it("rejects other schemes and malformed values", () => {
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeExternalUrl("not a url")).toBe(false);
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl("")).toBe(false);
  });
});
