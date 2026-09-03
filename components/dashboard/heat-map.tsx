"use client";

import { useMemo, useState } from "react";
import { DayActivity } from "~/components/dashboard/streak-utils";

type DayCell = {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isCurrentMonth: boolean;
  isFuture: boolean;
};

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

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-slate-200/45",
  1: "bg-blue-400/20",
  2: "bg-blue-400/40",
  3: "bg-blue-500/65",
  4: "bg-blue-600",
};

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function buildMonthGrid(
  activity: DayActivity[],
  monthDate: Date,
  today: Date,
): DayCell[][] {
  const byDate = new Map(activity.map((item) => [item.date, item.count]));
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    week.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      count: 0,
      level: 0,
      isCurrentMonth: false,
      isFuture: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const iso = date.toISOString().slice(0, 10);
    const count = byDate.get(iso) ?? 0;

    week.push({
      date,
      count,
      level: getLevel(count),
      isCurrentMonth: true,
      isFuture: date > today,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push({
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        count: 0,
        level: 0,
        isCurrentMonth: false,
        isFuture: false,
      });
    }
    weeks.push(week);
  }

  while (weeks.length < 5) {
    weeks.push(
      Array.from({ length: 7 }, () => ({
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        count: 0,
        level: 0,
        isCurrentMonth: false,
        isFuture: false,
      })),
    );
  }

  return weeks.slice(0, 6);
}

type StreakHeatmapProps = {
  activity: DayActivity[];
  today?: Date;
};

export function StreakHeatmap({
  activity,
  today = new Date(),
}: StreakHeatmapProps) {
  const [activeMonth, setActiveMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const monthGrid = useMemo(
    () => buildMonthGrid(activity, activeMonth, today),
    [activity, activeMonth, today],
  );

  const monthLabel = `${MONTH_NAMES[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`;

  const canGoNext =
    activeMonth.getFullYear() < today.getFullYear() ||
    (activeMonth.getFullYear() === today.getFullYear() &&
      activeMonth.getMonth() < today.getMonth());

  const canGoPrev = activeMonth.getFullYear() > today.getFullYear() - 1;

  const shiftMonth = (offset: number) => {
    setActiveMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + offset);
      next.setDate(1);
      return next;
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-white/80 p-3 shadow-lg shadow-slate-950/10 ring-1 ring-blue-500/10 backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={!canGoPrev}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm font-semibold text-slate-900">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={!canGoNext}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
        <span className="text-[10px] text-slate-500">Activity calendar</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-rows-6 gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {monthGrid.flatMap((week, weekIndex) =>
          week.map((cell, dayIndex) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="aspect-square rounded-[6px] bg-transparent"
                />
              );
            }

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                title={`${cell.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })} · ${cell.count} activity${cell.count === 1 ? "" : "ies"}`}
                className={`aspect-square rounded-[6px] border border-white/60 p-1 text-[10px] leading-none text-slate-900 ${
                  cell.isFuture ? "bg-slate-100/50" : LEVEL_CLASSES[cell.level]
                }`}
              >
                <span className="block text-[9px] font-semibold text-slate-800/90">
                  {cell.date.getDate()}
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}