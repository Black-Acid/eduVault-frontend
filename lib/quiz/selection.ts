import type { Paper, Subject } from "~/lib/api/schemas";

/**
 * Exact paper resolution.
 *
 * The previous implementation reconstructed a subject name from a hyphenated
 * query string and then submitted `subject.papers[0].id` - which meant a
 * student could answer the 2020 paper and have the 2025 paper marked. Every
 * selection now travels as stable backend ids, and the subject name, year and
 * paper number all come from the one Paper record those ids resolve to.
 */

export type PaperSelection = {
  subject: Subject;
  paper: Paper;
};

/** Parses a query-string integer. Rejects empty, non-numeric and non-positive values. */
export function parseId(value: string | string[] | undefined | null): number | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Resolves `subjectId`/`paperId` to a single backend Paper.
 *
 * Returns null when the subject does not exist, or when the paper exists but
 * belongs to a *different* subject - a mismatched pair is never silently
 * repaired by falling back to another paper.
 */
export function resolvePaperSelection(
  subjects: Subject[],
  subjectId: number | null,
  paperId: number | null,
): PaperSelection | null {
  if (subjectId === null || paperId === null) return null;

  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) return null;

  const paper = subject.papers.find((item) => item.id === paperId);
  if (!paper) return null;

  return { subject, paper };
}

/** Canonical quiz URL. Uses URLSearchParams so names are encoded, not mangled. */
export function buildQuizHref(subjectId: number, paperId: number): string {
  const params = new URLSearchParams({
    subjectId: String(subjectId),
    paperId: String(paperId),
  });

  return `/student/play-quiz?${params.toString()}`;
}

/**
 * Quiz selector, optionally pre-filtered to one subject. Used by the dashboard
 * "Practice subject" action - the backend has no topic-filtered quiz endpoint,
 * so subject level is as specific as we can honestly go.
 */
export function buildQuizSelectorHref(subjectId?: number | null): string {
  if (subjectId === null || subjectId === undefined) return "/student/play-quiz";

  const params = new URLSearchParams({ subjectId: String(subjectId) });
  return `/student/play-quiz?${params.toString()}`;
}

/** Case/whitespace-insensitive subject name lookup, for deep links by name. */
export function findSubjectByName(subjects: Subject[], name: string): Subject | null {
  const normalized = name.trim().toLowerCase();
  return subjects.find((subject) => subject.name.trim().toLowerCase() === normalized) ?? null;
}
