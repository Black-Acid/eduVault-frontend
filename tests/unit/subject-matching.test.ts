import { describe, expect, it } from "vitest";

import {
  availableTodayCount,
  matchesForTutor,
  matchTutorSubjects,
} from "~/lib/tutors/subject-matching";
import { subjectsFixture, tutorFixture } from "../fixtures";

describe("tutor subject mapping", () => {
  it("resolves a matching subject name to its backend id", () => {
    const { bookable } = matchTutorSubjects(["Physics"], subjectsFixture);

    expect(bookable).toEqual([{ id: 6, name: "Physics" }]);
  });

  it("matches case-insensitively and tolerates extra whitespace", () => {
    const { bookable } = matchTutorSubjects(["  physics ", "INTEGRATED   SCIENCE"], subjectsFixture);

    expect(bookable.map((subject) => subject.id).sort()).toEqual([1, 6]);
  });

  it("does NOT guess an id for a subject the catalogue does not contain", () => {
    const { bookable, unresolved } = matchTutorSubjects(["Elective ICT"], subjectsFixture);

    expect(bookable).toEqual([]);
    expect(unresolved).toEqual(["Elective ICT"]);
  });

  it("separates resolvable subjects from unresolvable ones", () => {
    const { bookable, unresolved } = matchesForTutor(tutorFixture, subjectsFixture);

    expect(bookable.map((subject) => subject.name).sort()).toEqual(["Chemistry", "Physics"]);
    expect(unresolved).toEqual(["Elective ICT"]);
  });

  it("never returns a partial-match id", () => {
    const { bookable, unresolved } = matchTutorSubjects(["Physic", "Physics II"], subjectsFixture);

    expect(bookable).toEqual([]);
    expect(unresolved).toEqual(["Physic", "Physics II"]);
  });

  it("deduplicates a subject listed twice", () => {
    const { bookable } = matchTutorSubjects(["Physics", "physics"], subjectsFixture);
    expect(bookable).toHaveLength(1);
  });

  it("ignores blank names", () => {
    const { bookable, unresolved } = matchTutorSubjects(["", "   "], subjectsFixture);

    expect(bookable).toEqual([]);
    expect(unresolved).toEqual([]);
  });

  it("returns nothing bookable when the catalogue is empty", () => {
    const { bookable, unresolved } = matchTutorSubjects(["Physics"], []);

    expect(bookable).toEqual([]);
    expect(unresolved).toEqual(["Physics"]);
  });
});

describe("availability count", () => {
  it("counts only tutors the backend reports as available today", () => {
    const tutors = [
      { ...tutorFixture, id: 1, is_available_today: true },
      { ...tutorFixture, id: 2, is_available_today: false },
      { ...tutorFixture, id: 3, is_available_today: true },
    ];

    expect(availableTodayCount(tutors)).toBe(2);
  });

  it("is zero for an empty list", () => {
    expect(availableTodayCount([])).toBe(0);
  });
});
