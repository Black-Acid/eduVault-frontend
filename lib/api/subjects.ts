import { apiFetch } from "./client";
import { subjectListSchema, type Subject } from "./schemas";

/**
 * `GET /subjects` - public. Returns every subject with its available papers.
 *
 * The catalogue changes rarely, so a short revalidation window is safe; it
 * contains no user-specific data.
 */
export async function getSubjects(): Promise<Subject[]> {
  return apiFetch("/subjects", {
    schema: subjectListSchema,
    next: { revalidate: 300, tags: ["subjects"] },
  });
}

/** The distinct years available for a subject, newest first. */
export function yearsForSubject(subject: Subject): number[] {
  return [...new Set(subject.papers.map((paper) => paper.year))].sort((a, b) => b - a);
}

/** The papers of a subject for one specific year, deduplicated by paper number. */
export function papersForYear(subject: Subject, year: number) {
  const seen = new Set<string>();

  return subject.papers
    .filter((paper) => paper.year === year)
    .filter((paper) => {
      if (seen.has(paper.paper_number)) return false;
      seen.add(paper.paper_number);
      return true;
    })
    .sort((a, b) => a.paper_number.localeCompare(b.paper_number));
}
