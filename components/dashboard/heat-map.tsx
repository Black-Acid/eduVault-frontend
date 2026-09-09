import Link from "next/link";

import type { DayActivity } from "~/lib/dashboard/activity";
import {
  buildDashboardHref,
  daysInMonth,
  firstWeekdayOfMonth,
  isoDate,
  isSameMonth,
  MIN_YEAR,
  monthLabel,
  shiftMonth,
  type YearMonth,
} from "~/lib/date/month";

type DayCell = {
  day: number;
  iso: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
};

const WEEKDAY_LABELS = [
  { key: "sun", label: "S", full: "Sunday" },
  { key: "mon", label: "M", full: "Monday" },
  { key: "tue", label: "T", full: "Tuesday" },
  { key: "wed", label: "W", full: "Wednesday" },
  { key: "thu", label: "T", full: "Thursday" },
  { key: "fri", label: "F", full: "Friday" },
  { key: "sat", label: "S", full: "Saturday" },
];

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

function todayIso(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
}

function buildCells(activity: DayActivity[], yearMonth: YearMonth, today: Date): DayCell[] {
  const counts = new Map(activity.map((day) => [day.date, day.count]));
  const total = daysInMonth(yearMonth);
  const boundary = todayIso(today);

  return Array.from({ length: total }, (_, index) => {
    const day = index + 1;
    const iso = isoDate(yearMonth, day);
    const count = counts.get(iso) ?? 0;

    return {
      day,
      iso,
      count,
      level: getLevel(count),
      isFuture: iso > boundary,
    };
  });
}

export type StreakHeatmapProps = {
  activity: DayActivity[];
  /** The month the backend actually returned data for. */
  yearMonth: YearMonth;
  /** The most recent month the user may navigate to. */
  currentMonth: YearMonth;
  today?: Date;
};

/**
 * Monthly activity calendar.
 *
 * Month navigation is server-driven (`/student?year=&month=`) because the
 * backend returns exactly one month per request. Paging locally would render
 * an empty grid for every other month, which reads as "no study activity"
 * rather than "not loaded".
 */
export function StreakHeatmap({
  activity,
  yearMonth,
  currentMonth,
  today = new Date(),
}: StreakHeatmapProps) {
  const cells = buildCells(activity, yearMonth, today);
  const leadingBlanks = firstWeekdayOfMonth(yearMonth);

  const previous = shiftMonth(yearMonth, -1);
  const next = shiftMonth(yearMonth, 1);

  const canGoPrev = previous.year >= MIN_YEAR;
  const canGoNext = !isSameMonth(yearMonth, currentMonth);

  const label = monthLabel(yearMonth);
  const navClass =
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
  const navDisabledClass =
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400 opacity-40 cursor-not-allowed";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-white/80 p-3 shadow-lg shadow-slate-950/10 ring-1 ring-blue-500/10 backdrop-blur-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {canGoPrev ? (
            <Link
              href={buildDashboardHref(previous)}
              scroll={false}
              className={navClass}
              aria-label={`Show activity for ${monthLabel(previous)}`}
            >
              Prev
            </Link>
          ) : (
            <span className={navDisabledClass} aria-hidden="true">
              Prev
            </span>
          )}

          <span className="text-sm font-semibold text-slate-900" aria-live="polite">
            {label}
          </span>

          {canGoNext ? (
            <Link
              href={buildDashboardHref(next)}
              scroll={false}
              className={navClass}
              aria-label={`Show activity for ${monthLabel(next)}`}
            >
              Next
            </Link>
          ) : (
            <span className={navDisabledClass} aria-hidden="true">
              Next
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">Quizzes attempted per day</span>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500"
        aria-hidden="true"
      >
        {WEEKDAY_LABELS.map(({ key, label: initial }) => (
          <span key={key}>{initial}</span>
        ))}
      </div>

      <ul className="mt-2 grid grid-cols-7 gap-1 p-0">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <li key={`blank-${index}`} aria-hidden="true" className="aspect-square rounded-[6px]" />
        ))}

        {cells.map((cell) => (
          <li
            key={cell.iso}
            title={`${cell.iso}: ${cell.count} ${cell.count === 1 ? "quiz" : "quizzes"}`}
            className={`aspect-square rounded-[6px] border border-white/60 p-1 text-[10px] leading-none ${
              cell.isFuture ? "bg-slate-100/50" : LEVEL_CLASSES[cell.level]
            }`}
          >
            <span className="sr-only">
              {cell.iso}: {cell.count} {cell.count === 1 ? "quiz" : "quizzes"}
            </span>
            <span aria-hidden="true" className="block text-[9px] font-semibold text-slate-800/90">
              {cell.day}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
