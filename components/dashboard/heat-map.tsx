"use client";

import { useMemo } from "react";
import { DayActivity } from "~/components/dashboard/streak-utils";

type Cell = {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
};

const WEEKS_TO_SHOW = 52;

const LEVEL_CLASSES: Record<number, string> = {
  0: "bg-slate-200/55 ring-1 ring-slate-300/70",
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

function buildWeeks(
  activity: DayActivity[],
  weeksCount: number,
  today: Date,
): Cell[][] {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));

  const dayOfWeek = today.getDay();
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-white/70 p-4 text-slate-900 shadow-lg shadow-slate-950/10 ring-1 ring-blue-500/10 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/35 ring-1 ring-white/30" />
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span
            key={lvl}
            className={`h-2.5 w-2.5 rounded-sm ${LEVEL_CLASSES[lvl]}`}
          />
        ))}
        <span>More</span>
      </div>

      <div className="mt-3 w-full">
        <div className="flex w-full gap-2.5">
          <div className="grid shrink-0 grid-rows-7 gap-0.5 pt-4">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="h-3 text-[9px] leading-3 text-slate-500">
                {label}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div
              className="grid h-3 w-full"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
                columnGap: 2,
              }}
            >
              {weeks.map((_, col) => {
                const match = monthLabels.find((m) => m.col === col);
                return (
                  <span key={col} className="text-[9px] text-slate-900">
                    {match?.label ?? ""}
                  </span>
                );
              })}
            </div>

            <div
              className="grid w-full grid-flow-col grid-rows-7 gap-0.5"
              style={{ gridAutoColumns: "minmax(0, 1fr)" }}
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
                    className={`aspect-square w-full rounded-[3px] ${
                      cell.isFuture ? "bg-transparent" : LEVEL_CLASSES[cell.level]
                    }`}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}