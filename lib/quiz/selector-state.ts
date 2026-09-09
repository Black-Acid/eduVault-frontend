import type { Paper, Subject } from "~/lib/api/schemas";
import { papersForYear, yearsForSubject } from "~/lib/api/subjects";

/**
 * Pure state machine behind the quiz selector.
 *
 * Keeping it out of the component makes the dependency rules testable and,
 * more importantly, makes them explicit: a subject change invalidates the year
 * and the paper, and a year change invalidates the paper. Without that, the
 * selector could hand the server a (subject, year, paper) triple that no single
 * backend Paper record satisfies.
 */

export type QuizSelectorState = {
  subjectId: number | null;
  year: number | null;
  paperId: number | null;
};

export type QuizSelectorAction =
  | { type: "select-subject"; subjectId: number | null }
  | { type: "select-year"; year: number | null }
  | { type: "select-paper"; paperId: number | null }
  | { type: "reset" };

export const EMPTY_SELECTION: QuizSelectorState = {
  subjectId: null,
  year: null,
  paperId: null,
};

export function initialSelectorState(subjectId?: number | null): QuizSelectorState {
  return { ...EMPTY_SELECTION, subjectId: subjectId ?? null };
}

export function quizSelectorReducer(
  state: QuizSelectorState,
  action: QuizSelectorAction,
): QuizSelectorState {
  switch (action.type) {
    case "select-subject": {
      if (state.subjectId === action.subjectId) return state;
      // A different subject invalidates everything downstream.
      return { subjectId: action.subjectId, year: null, paperId: null };
    }

    case "select-year": {
      if (state.year === action.year) return state;
      // A different year invalidates the paper.
      return { ...state, year: action.year, paperId: null };
    }

    case "select-paper":
      return { ...state, paperId: action.paperId };

    case "reset":
      return EMPTY_SELECTION;

    default:
      return state;
  }
}

export function selectedSubject(
  subjects: readonly Subject[],
  state: QuizSelectorState,
): Subject | null {
  if (state.subjectId === null) return null;
  return subjects.find((subject) => subject.id === state.subjectId) ?? null;
}

/** Years the selected subject actually has papers for, newest first. */
export function availableYears(subjects: readonly Subject[], state: QuizSelectorState): number[] {
  const subject = selectedSubject(subjects, state);
  return subject ? yearsForSubject(subject) : [];
}

/**
 * Papers for the selected subject *and* year.
 *
 * The previous selector listed every paper number belonging to the subject
 * regardless of year, so a student could pick a paper that did not exist for
 * the year they had chosen.
 */
export function availablePapers(subjects: readonly Subject[], state: QuizSelectorState): Paper[] {
  const subject = selectedSubject(subjects, state);
  if (!subject || state.year === null) return [];
  return papersForYear(subject, state.year);
}

/** True when the selection identifies exactly one backend Paper. */
export function isSelectionComplete(
  subjects: readonly Subject[],
  state: QuizSelectorState,
): state is QuizSelectorState & { subjectId: number; year: number; paperId: number } {
  if (state.subjectId === null || state.year === null || state.paperId === null) return false;
  return availablePapers(subjects, state).some((paper) => paper.id === state.paperId);
}
