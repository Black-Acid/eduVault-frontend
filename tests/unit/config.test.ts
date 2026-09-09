import { describe, expect, it } from "vitest";

import { API_BASE_URL_ENV, buildApiUrl, getApiBaseUrl } from "~/lib/api/config";
import { ApiError } from "~/lib/api/errors";

describe("API configuration", () => {
  it("reads the server-only environment variable", () => {
    const env = { [API_BASE_URL_ENV]: "https://eduvault-jadl.onrender.com" };
    expect(getApiBaseUrl(env)).toBe("https://eduvault-jadl.onrender.com");
  });

  it("strips trailing slashes so paths never double up", () => {
    const env = { [API_BASE_URL_ENV]: "https://api.example.com///" };
    expect(getApiBaseUrl(env)).toBe("https://api.example.com");
  });

  it("rejects a missing configuration rather than falling back to a literal", () => {
    expect(() => getApiBaseUrl({})).toThrowError(ApiError);
    expect(() => getApiBaseUrl({})).toThrowError(/EDUVAULT_API_URL is not set/);
  });

  it("rejects a blank configuration", () => {
    expect(() => getApiBaseUrl({ [API_BASE_URL_ENV]: "   " })).toThrowError(
      ApiError,
    );
  });

  it("rejects a non-URL value", () => {
    expect(() =>
      getApiBaseUrl({ [API_BASE_URL_ENV]: "not-a-url" }),
    ).toThrowError(/not a valid absolute URL/);
  });

  it("rejects a non-http protocol", () => {
    expect(() =>
      getApiBaseUrl({ [API_BASE_URL_ENV]: "ftp://example.com" }),
    ).toThrowError(/must use http or https/);
  });

  it("throws a config-kind ApiError, so callers can tell it apart from an outage", () => {
    try {
      getApiBaseUrl({});
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).kind).toBe("config");
    }
  });

  describe("buildApiUrl", () => {
    const env = { [API_BASE_URL_ENV]: "https://api.example.com" };

    it("joins a path", () => {
      expect(buildApiUrl("/subjects", undefined, env)).toBe("https://api.example.com/subjects");
    });

    it("normalises a path that is missing its leading slash", () => {
      expect(buildApiUrl("subjects", undefined, env)).toBe("https://api.example.com/subjects");
    });

    it("encodes query parameters", () => {
      expect(buildApiUrl("/dashboard", { year: 2026, month: 9 }, env)).toBe(
        "https://api.example.com/dashboard?year=2026&month=9",
      );
    });

    it("omits null and undefined parameters", () => {
      expect(buildApiUrl("/dashboard", { year: 2026, month: null, extra: undefined }, env)).toBe(
        "https://api.example.com/dashboard?year=2026",
      );
    });
  });
});
