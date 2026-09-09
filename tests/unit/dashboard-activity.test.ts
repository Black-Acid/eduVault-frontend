import { describe, expect, it } from "vitest";

import {
  activeDayCount,
  dashboardActivity,
  deriveSubjectPerformance,
  toDayActivity,
  totalActivity,
} from "~/lib/dashboard/activity";
import { dashboardFixture, emptyDashboardFixture } from "../fixtures";

describe("monthly activity mapping", () => {
  it("maps quiz_count to count, preserving the backend's dates", () => {
    expect(toDayActivity(dashboardFixture.monthly_activity)).toEqual([
      { date: "2026-09-01", count: 0 },
      { date: "2026-09-02", count: 3 },
      { date: "2026-09-03", count: 12 },
    ]);
  });

  it("produces exactly as many days as the backend returned - nothing is generated", () => {
    const activity = dashboardActivity(dashboardFixture);
    expect(activity).toHaveLength(dashboardFixture.monthly_activity.days.length);
  });

  it("maps an empty month to an empty array", () => {
    expect(toDayActivity(emptyDashboardFixture.monthly_activity)).toEqual([]);
  });

  it("sums the month's quizzes", () => {
    expect(totalActivity(toDayActivity(dashboardFixture.monthly_activity))).toBe(15);
  });

  it("counts only days with activity", () => {
    expect(activeDayCount(toDayActivity(dashboardFixture.monthly_activity))).toBe(2);
  });
});

describe("derived subject performance", () => {
  it("finds the strongest and weakest subject from real mastery values", () => {
    const performance = deriveSubjectPerformance(dashboardFixture.subject_mastery);

    expect(performance.strongest?.subject_name).toBe("Physics");
    expect(performance.weakest?.subject_name).toBe("Chemistry");
  });

  it("averages the mastery percentages", () => {
    const performance = deriveSubjectPerformance(dashboardFixture.subject_mastery);
    expect(performance.averageMastery).toBeCloseTo(63.25, 5);
  });

  it("returns nulls for an empty list rather than inventing a readiness band", () => {
    expect(deriveSubjectPerformance([])).toEqual({
      strongest: null,
      weakest: null,
      averageMastery: null,
    });
  });

  it("uses the same subject for strongest and weakest when there is only one", () => {
    const single = [{ subject_name: "Physics", mastery_percentage: 40, strongest_topic: null }];
    const performance = deriveSubjectPerformance(single);

    expect(performance.strongest?.subject_name).toBe("Physics");
    expect(performance.weakest?.subject_name).toBe("Physics");
    expect(performance.averageMastery).toBe(40);
  });

  it("handles all-equal masteries deterministically", () => {
    const equal = [
      { subject_name: "A", mastery_percentage: 50, strongest_topic: null },
      { subject_name: "B", mastery_percentage: 50, strongest_topic: null },
    ];

    const performance = deriveSubjectPerformance(equal);
    expect(performance.strongest?.subject_name).toBe("A");
    expect(performance.weakest?.subject_name).toBe("A");
  });
});
