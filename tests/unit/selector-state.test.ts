import { describe, expect, it } from "vitest";

import { papersForYear, yearsForSubject } from "~/lib/api/subjects";
import {
  availablePapers,
  availableYears,
  initialSelectorState,
  isSelectionComplete,
  quizSelectorReducer,
  selectedSubject,
} from "~/lib/quiz/selector-state";
import { subjectsFixture } from "../fixtures";

const physics = subjectsFixture.find((subject) => subject.name === "Physics")!;

describe("quiz selector dependencies", () => {
  it("resets the year and the paper when the subject changes", () => {
    const state = { subjectId: 6, year: 2020, paperId: 7 };
    const next = quizSelectorReducer(state, { type: "select-subject", subjectId: 4 });

    expect(next).toEqual({ subjectId: 4, year: null, paperId: null });
  });

  it("leaves the selection untouched when the same subject is re-selected", () => {
    const state = { subjectId: 6, year: 2020, paperId: 7 };
    expect(quizSelectorReducer(state, { type: "select-subject", subjectId: 6 })).toBe(state);
  });

  it("resets the paper when the year changes", () => {
    const state = { subjectId: 6, year: 2020, paperId: 7 };
    const next = quizSelectorReducer(state, { type: "select-year", year: 2025 });

    expect(next).toEqual({ subjectId: 6, year: 2025, paperId: null });
  });

  it("keeps the subject and year when the paper changes", () => {
    const state = { subjectId: 6, year: 2020, paperId: 7 };
    const next = quizSelectorReducer(state, { type: "select-paper", paperId: 8 });

    expect(next).toEqual({ subjectId: 6, year: 2020, paperId: 8 });
  });

  it("clears the subject when it is deselected", () => {
    const state = { subjectId: 6, year: 2020, paperId: 7 };
    const next = quizSelectorReducer(state, { type: "select-subject", subjectId: null });

    expect(next).toEqual({ subjectId: null, year: null, paperId: null });
  });

  it("resets everything", () => {
    const next = quizSelectorReducer(
      { subjectId: 6, year: 2020, paperId: 7 },
      { type: "reset" },
    );

    expect(next).toEqual({ subjectId: null, year: null, paperId: null });
  });

  it("can be seeded with a subject from a deep link", () => {
    expect(initialSelectorState(6)).toEqual({ subjectId: 6, year: null, paperId: null });
    expect(initialSelectorState()).toEqual({ subjectId: null, year: null, paperId: null });
  });
});

describe("options offered by the selector", () => {
  it("lists the distinct years of the selected subject, newest first", () => {
    expect(availableYears(subjectsFixture, { subjectId: 6, year: null, paperId: null })).toEqual([
      2025, 2020,
    ]);
  });

  it("deduplicates years for a subject with two papers in one year", () => {
    expect(yearsForSubject(physics)).toEqual([2025, 2020]);
  });

  it("returns no years until a subject is chosen", () => {
    expect(availableYears(subjectsFixture, { subjectId: null, year: null, paperId: null })).toEqual(
      [],
    );
  });

  it("lists only the papers for the selected subject AND year", () => {
    const papers = availablePapers(subjectsFixture, { subjectId: 6, year: 2025, paperId: null });

    expect(papers).toHaveLength(1);
    expect(papers[0].id).toBe(6);
  });

  it("does not leak papers from another year of the same subject", () => {
    const papers = availablePapers(subjectsFixture, { subjectId: 6, year: 2020, paperId: null });

    expect(papers.map((paper) => paper.id).sort()).toEqual([7, 8]);
    expect(papers.some((paper) => paper.id === 6)).toBe(false);
  });

  it("deduplicates repeated paper numbers within a year", () => {
    const subject = {
      id: 99,
      name: "Duplicated",
      papers: [
        { id: 10, year: 2024, paper_number: "Paper 1" },
        { id: 11, year: 2024, paper_number: "Paper 1" },
      ],
    };

    expect(papersForYear(subject, 2024)).toHaveLength(1);
  });

  it("returns no papers until a year is chosen", () => {
    expect(availablePapers(subjectsFixture, { subjectId: 6, year: null, paperId: null })).toEqual(
      [],
    );
  });

  it("resolves the selected subject", () => {
    expect(selectedSubject(subjectsFixture, { subjectId: 6, year: null, paperId: null })?.name).toBe(
      "Physics",
    );
    expect(selectedSubject(subjectsFixture, { subjectId: null, year: null, paperId: null })).toBeNull();
  });
});

describe("selection completeness", () => {
  it("is complete when the trio identifies one real paper", () => {
    expect(isSelectionComplete(subjectsFixture, { subjectId: 6, year: 2020, paperId: 7 })).toBe(
      true,
    );
  });

  it("is incomplete when any part is missing", () => {
    expect(isSelectionComplete(subjectsFixture, { subjectId: 6, year: 2020, paperId: null })).toBe(
      false,
    );
    expect(isSelectionComplete(subjectsFixture, { subjectId: 6, year: null, paperId: 7 })).toBe(
      false,
    );
  });

  it("is incomplete when the paper does not belong to the selected year", () => {
    // Paper 6 is the 2025 paper, not a 2020 one.
    expect(isSelectionComplete(subjectsFixture, { subjectId: 6, year: 2020, paperId: 6 })).toBe(
      false,
    );
  });

  it("is incomplete when the paper belongs to a different subject", () => {
    expect(isSelectionComplete(subjectsFixture, { subjectId: 6, year: 2024, paperId: 1 })).toBe(
      false,
    );
  });
});
