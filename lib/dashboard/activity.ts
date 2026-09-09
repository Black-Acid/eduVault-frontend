import type { DashboardResponse, MonthlyActivity, SubjectMastery } from "~/lib/api/schemas";

/** One calendar day in the activity heatmap. */
export type DayActivity = {
  /** `YYYY-MM-DD`, exactly as the backend emits it. */
  date: string;
  count: number;
};

/**
 * Adapts the backend's `monthly_activity` to the heatmap's shape.
 *
 * This is the only source of heatmap data. The previous build generated 365
 * days with `Math.random()`, which meant the calendar showed study activity
 * that had never happened.
 */
export function toDayActivity(monthlyActivity: MonthlyActivity): DayActivity[] {
  return monthlyActivity.days.map((day) => ({
    date: day.date,
    count: day.quiz_count,
  }));
}

/** Total quizzes recorded in the month the backend returned. */
export function totalActivity(activity: DayActivity[]): number {
  return activity.reduce((total, day) => total + day.count, 0);
}

/** Days in the month on which at least one quiz was attempted. */
export function activeDayCount(activity: DayActivity[]): number {
  return activity.filter((day) => day.count > 0).length;
}

export type DerivedSubjectPerformance = {
  strongest: SubjectMastery | null;
  weakest: SubjectMastery | null;
  /** Mean of the returned subject mastery percentages. Null when there is none. */
  averageMastery: number | null;
};

/**
 * Strongest/weakest subject, derived arithmetically from real
 * `subject_mastery` values.
 *
 * This is deliberately NOT presented as a WASSCE-readiness score: the backend
 * exposes no readiness metric, and inventing a Ready/Moderate/Not-ready band
 * would be a fabricated assessment.
 */
export function deriveSubjectPerformance(
  subjectMastery: SubjectMastery[],
): DerivedSubjectPerformance {
  if (subjectMastery.length === 0) {
    return { strongest: null, weakest: null, averageMastery: null };
  }

  let strongest = subjectMastery[0];
  let weakest = subjectMastery[0];
  let total = 0;

  for (const subject of subjectMastery) {
    if (subject.mastery_percentage > strongest.mastery_percentage) strongest = subject;
    if (subject.mastery_percentage < weakest.mastery_percentage) weakest = subject;
    total += subject.mastery_percentage;
  }

  return {
    strongest,
    weakest,
    averageMastery: total / subjectMastery.length,
  };
}

/** Convenience wrapper used by the dashboard page. */
export function dashboardActivity(dashboard: DashboardResponse): DayActivity[] {
  return toDayActivity(dashboard.monthly_activity);
}
