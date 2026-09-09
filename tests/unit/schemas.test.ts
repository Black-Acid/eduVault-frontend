import { describe, expect, it } from "vitest";

import {
  dashboardResponseSchema,
  paperSchema,
  studentSessionSchema,
  subjectListSchema,
  submitPaperResponseSchema,
  tutorSchema,
} from "~/lib/api/schemas";
import { dashboardFixture, sessionFixture, tutorFixture } from "../fixtures";

describe("API response validation", () => {
  it("accepts a valid subject list", () => {
    const result = subjectListSchema.safeParse([
      { id: 1, name: "Physics", papers: [{ id: 6, year: 2025, paper_number: "Paper 1" }] },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects a response whose shape does not match, instead of coercing it", () => {
    const result = subjectListSchema.safeParse([{ id: "one", name: "Physics", papers: [] }]);
    expect(result.success).toBe(false);
  });

  it("rejects a non-array where the backend documents a list", () => {
    expect(subjectListSchema.safeParse({ subjects: [] }).success).toBe(false);
  });

  describe("numeric/string normalisation", () => {
    it("normalises a string paper year to a number", () => {
      const result = paperSchema.parse({ id: 6, year: "2025", paper_number: "Paper 1" });
      expect(result.year).toBe(2025);
      expect(typeof result.year).toBe("number");
    });

    it("normalises a numeric paper number to a string", () => {
      const result = paperSchema.parse({ id: 6, year: 2025, paper_number: 1 });
      expect(result.paper_number).toBe("1");
      expect(typeof result.paper_number).toBe("string");
    });

    it("rejects a year that is not numeric at all", () => {
      expect(paperSchema.safeParse({ id: 6, year: "twenty", paper_number: "1" }).success).toBe(
        false,
      );
    });

    it("normalises the tutor's stringified Decimal session fee", () => {
      const result = tutorSchema.parse({ ...tutorFixture, session_fee: "50.0" });
      expect(result.session_fee).toBe(50);
    });
  });

  describe("null handling", () => {
    it("keeps total_duration_minutes as null rather than defaulting it to zero", () => {
      const result = dashboardResponseSchema.parse(dashboardFixture);
      expect(result.overview.total_duration_minutes).toBeNull();
    });

    it("preserves a real zero duration", () => {
      const result = dashboardResponseSchema.parse({
        ...dashboardFixture,
        overview: { ...dashboardFixture.overview, total_duration_minutes: 0 },
      });

      expect(result.overview.total_duration_minutes).toBe(0);
    });

    it("tolerates an omitted total_duration_minutes", () => {
      const overview: Partial<typeof dashboardFixture.overview> = {
        ...dashboardFixture.overview,
      };
      delete overview.total_duration_minutes;

      const result = dashboardResponseSchema.parse({ ...dashboardFixture, overview });
      expect(result.overview.total_duration_minutes).toBeNull();
    });

    it("normalises a null strongest_topic", () => {
      const result = dashboardResponseSchema.parse(dashboardFixture);
      expect(result.subject_mastery[0].strongest_topic).toBeNull();
    });

    it("normalises nullable tutor fields", () => {
      const result = tutorSchema.parse({
        ...tutorFixture,
        profile_image: null,
        location: null,
        bio: null,
      });

      expect(result.profile_image).toBeNull();
      expect(result.location).toBeNull();
      expect(result.bio).toBeNull();
    });
  });

  describe("session status", () => {
    it("accepts every documented status", () => {
      for (const status of [
        "PENDING",
        "CONFIRMED",
        "LIVE",
        "COMPLETED",
        "DECLINED",
        "CANCELLED",
      ]) {
        expect(studentSessionSchema.safeParse(sessionFixture({ status })).success).toBe(true);
      }
    });

    it("accepts an unknown future status rather than failing the whole response", () => {
      const result = studentSessionSchema.parse(sessionFixture({ status: "RESCHEDULED" }));
      expect(result.status).toBe("RESCHEDULED");
    });

    it("upper-cases a lower-case status", () => {
      const result = studentSessionSchema.parse(sessionFixture({ status: "live" }));
      expect(result.status).toBe("LIVE");
    });
  });

  it("defaults an omitted wrong_questions array", () => {
    const result = submitPaperResponseSchema.parse({
      attempt_id: 7,
      score: 5,
      total_questions: 5,
      percentage: 100,
      correct: 5,
      wrong: 0,
    });

    expect(result.wrong_questions).toEqual([]);
  });
});
