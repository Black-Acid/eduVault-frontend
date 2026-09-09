import { describe, expect, it } from "vitest";

import {
  buildQuizHref,
  buildQuizSelectorHref,
  findSubjectByName,
  parseId,
  resolvePaperSelection,
} from "~/lib/quiz/selection";
import { subjectsFixture } from "../fixtures";

describe("parseId", () => {
  it("parses a positive integer", () => {
    expect(parseId("6")).toBe(6);
  });

  it("rejects zero, negatives, decimals and text", () => {
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId("1.5")).toBeNull();
    expect(parseId("six")).toBeNull();
  });

  it("rejects empty, missing and repeated parameters", () => {
    expect(parseId("")).toBeNull();
    expect(parseId(undefined)).toBeNull();
    expect(parseId(null)).toBeNull();
    expect(parseId(["6", "7"])).toBeNull();
  });
});

describe("exact paper selection", () => {
  it("resolves the exact subject and paper for a matching pair", () => {
    const selection = resolvePaperSelection(subjectsFixture, 6, 7);

    expect(selection).not.toBeNull();
    expect(selection?.subject.name).toBe("Physics");
    expect(selection?.paper.id).toBe(7);
    expect(selection?.paper.year).toBe(2020);
    expect(selection?.paper.paper_number).toBe("Paper 1");
  });

  it("distinguishes two papers of the same subject and year", () => {
    const first = resolvePaperSelection(subjectsFixture, 6, 7);
    const second = resolvePaperSelection(subjectsFixture, 6, 8);

    expect(first?.paper.paper_number).toBe("Paper 1");
    expect(second?.paper.paper_number).toBe("Paper 2");
  });

  it("does NOT fall back to papers[0] when the paper id belongs to another subject", () => {
    // Paper 1 belongs to Integrated Science, not Physics.
    const selection = resolvePaperSelection(subjectsFixture, 6, 1);

    expect(selection).toBeNull();
  });

  it("returns null for an unknown subject id", () => {
    expect(resolvePaperSelection(subjectsFixture, 999, 7)).toBeNull();
  });

  it("returns null for an unknown paper id", () => {
    expect(resolvePaperSelection(subjectsFixture, 6, 999)).toBeNull();
  });

  it("returns null when either id is missing", () => {
    expect(resolvePaperSelection(subjectsFixture, null, 7)).toBeNull();
    expect(resolvePaperSelection(subjectsFixture, 6, null)).toBeNull();
  });

  it("returns null against an empty subject list rather than throwing", () => {
    expect(resolvePaperSelection([], 6, 7)).toBeNull();
  });
});

describe("quiz links", () => {
  it("builds a quiz href from stable backend ids", () => {
    expect(buildQuizHref(6, 7)).toBe("/student/play-quiz?subjectId=6&paperId=7");
  });

  it("builds a subject-filtered selector href", () => {
    expect(buildQuizSelectorHref(6)).toBe("/student/play-quiz?subjectId=6");
  });

  it("builds a plain selector href when no subject is known", () => {
    expect(buildQuizSelectorHref(null)).toBe("/student/play-quiz");
    expect(buildQuizSelectorHref(undefined)).toBe("/student/play-quiz");
  });
});

describe("findSubjectByName", () => {
  it("matches a subject name exactly", () => {
    expect(findSubjectByName(subjectsFixture, "Physics")?.id).toBe(6);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(findSubjectByName(subjectsFixture, "  integrated science ")?.id).toBe(1);
  });

  it("returns null for a name that is not in the catalogue", () => {
    expect(findSubjectByName(subjectsFixture, "Astrophysics")).toBeNull();
  });
});
