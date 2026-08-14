"use client";

import { useMemo } from "react";

// ── Types ────────────────────────────────────────────────
export type DayActivity = {
  date: string; // yyyy-mm-dd
  count: number;
};

type Cell = {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
};

// ── Config ───────────────────────────────────────────────
const WEEKS_TO_SHOW = 52;

// Static, literal class strings so Tailwind's JIT can find them at build time.
const LEVEL_CLASSES: Record<number, string> = {
  0: "bg-white/[0.07]",
  1: "bg-blue-400/25",
  2: "bg-blue-400/50",
  3: "bg-blue-400/75",
  4: "bg-blue-400",
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 4) return 1;
  if (count <= 9) return 2;
  if (count <= 15) return 3;
  return 4;
}

// Builds a Sun→Sat grid of weeks ending on the most recent Saturday.
function buildWeeks(
  activity: DayActivity[],
  weeksCount: number,
  today: Date,
): Cell[][] {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));

  const dayOfWeek = today.getDay(); // 0 = Sun
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - dayOfWeek);

  const firstWeekStart = new Date(thisWeekStart);
  firstWeekStart.setDate(thisWeekStart.getDate() - (weeksCount - 1) * 7);

  const weeks: Cell[][] = [];

  for (let w = 0; w < weeksCount; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(firstWeekStart);
      date.setDate(firstWeekStart.getDate() + w * 7 + d);
      const iso = date.toISOString().slice(0, 10);
      const isFuture = date > today;
      const count = byDate.get(iso) ?? 0;
      week.push({ date, count, level: getLevel(count), isFuture });
    }
    weeks.push(week);
  }
  return weeks;
}

// Column index -> month label, only where the month changes.
function getMonthLabels(weeks: Cell[][]) {
  const labels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      labels.push({ col, label: MONTH_NAMES[month] });
      lastMonth = month;
    }
  });
  return labels;
}

function getCurrentStreak(activity: DayActivity[], today: Date): number {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if ((byDate.get(iso) ?? 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Component ────────────────────────────────────────────
type StreakHeatmapProps = {
  activity: DayActivity[];
  today?: Date;
};

export function StreakHeatmap({
  activity,
  today = new Date(),
}: StreakHeatmapProps) {
  const weeks = useMemo(
    () => buildWeeks(activity, WEEKS_TO_SHOW, today),
    [activity, today],
  );
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);
  const totalQuestions = useMemo(
    () => activity.reduce((sum, a) => sum + a.count, 0),
    [activity],
  );
  const currentStreak = useMemo(
    () => getCurrentStreak(activity, today),
    [activity, today],
  );
  const bestDay = useMemo(
    () =>
      activity.reduce((best, a) => (a.count > best.count ? a : best), {
        date: "",
        count: 0,
      }),
    [activity],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-navy continue-card p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-mono text-lg font-semibold">Practice streak</h3>
          <p className="mt-1 text-xs text-slate-400">
            <span className="font-bold text-white">
              {totalQuestions.toLocaleString()}
            </span>{" "}
            questions over the last {WEEKS_TO_SHOW} weeks
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              className={`h-2.5 w-2.5 rounded-sm ${LEVEL_CLASSES[lvl]}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-3">
          {/* Day-of-week labels */}
          <div className="grid shrink-0 grid-rows-7 gap-0.75 pt-4.5">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="h-3 text-[9px] leading-3 text-slate-500">
                {label}
              </span>
            ))}
          </div>

          {/* Months + cells */}
          <div className="flex flex-col gap-1.5">
            <div
              className="grid h-3"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, 14px)`,
                columnGap: 3,
              }}
            >
              {weeks.map((_, col) => {
                const match = monthLabels.find((m) => m.col === col);
                return (
                  <span key={col} className="text-[9.5px] text-slate-400">
                    {match?.label ?? ""}
                  </span>
                );
              })}
            </div>

            <div
              className="grid grid-flow-col grid-rows-7 gap-0.75"
              style={{ gridAutoColumns: "14px" }}
            >
              {weeks.map((week, wi) =>
                week.map((cell, di) => (
                  <div
                    key={`${wi}-${di}`}
                    title={
                      cell.isFuture
                        ? undefined
                        : `${cell.count} question${cell.count === 1 ? "" : "s"} · ${cell.date.toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}`
                    }
                    className={`h-3 w-3 rounded-[3px] ${
                      cell.isFuture
                        ? "bg-transparent"
                        : LEVEL_CLASSES[cell.level]
                    }`}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
        <span className="text-blue-400">🔥 {currentStreak}-day streak</span>
        {bestDay.date && (
          <span className="text-slate-400">
            Best day: {bestDay.count} questions,{" "}
            {new Date(bestDay.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
