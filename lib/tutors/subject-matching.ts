import type { Subject, Tutor } from "~/lib/api/schemas";

/**
 * Bridges a contract gap: `GET /tutors` returns a tutor's subjects as bare
 * *names*, but `POST /sessions/book` requires a `subject_id`.
 *
 * We resolve names against the canonical `/subjects` catalogue by exact
 * (case- and whitespace-insensitive) match. Anything that does not match is
 * reported as unresolved and cannot be booked - guessing an id would book the
 * student onto the wrong subject.
 *
 * The proper fix is for `/tutors` to return `{id, name}` objects; see
 * docs/BACKEND_CONTRACT_GAPS.md.
 */

export type BookableSubject = {
  id: number;
  name: string;
};

export type TutorSubjectMatch = {
  /** Subjects that resolved to a real backend subject id. */
  bookable: BookableSubject[];
  /** Names the tutor advertises that no `/subjects` record matches. */
  unresolved: string[];
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchTutorSubjects(
  tutorSubjectNames: readonly string[],
  subjects: readonly Subject[],
): TutorSubjectMatch {
  const catalogue = new Map<string, Subject>();
  for (const subject of subjects) {
    catalogue.set(normalize(subject.name), subject);
  }

  const bookable: BookableSubject[] = [];
  const unresolved: string[] = [];
  const seen = new Set<number>();

  for (const rawName of tutorSubjectNames) {
    const match = catalogue.get(normalize(rawName));

    if (!match) {
      if (rawName.trim()) unresolved.push(rawName.trim());
      continue;
    }

    if (seen.has(match.id)) continue;
    seen.add(match.id);
    bookable.push({ id: match.id, name: match.name });
  }

  return { bookable, unresolved };
}

export function matchesForTutor(tutor: Tutor, subjects: readonly Subject[]): TutorSubjectMatch {
  return matchTutorSubjects(tutor.subjects, subjects);
}

/** Count of tutors the backend reports as available today. Never "online now". */
export function availableTodayCount(tutors: readonly Tutor[]): number {
  return tutors.filter((tutor) => tutor.is_available_today).length;
}
