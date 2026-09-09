import {
  ChartUpIcon,
  Clock01Icon,
  Fire02Icon,
  Pen02Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import Link from "next/link";

import { StreakHeatmap } from "~/components/dashboard/heat-map";
import { EmptyState } from "~/components/general/states";
import { ProgressIndicator, ProgressTrack } from "~/components/ui/progress";
import type { DashboardResponse, Subject } from "~/lib/api/schemas";
import { deriveSubjectPerformance, toDayActivity } from "~/lib/dashboard/activity";
import type { YearMonth } from "~/lib/date/month";
import { monthLabel } from "~/lib/date/month";
import {
  formatDateTime,
  formatDurationMinutes,
  formatNumber,
  formatPercent,
  UNAVAILABLE,
} from "~/lib/format";
import { buildQuizSelectorHref, findSubjectByName } from "~/lib/quiz/selection";

/**
 * The student dashboard, rendered entirely from `GET /dashboard`.
 *
 * Every figure on this page comes from the backend response. Metrics the
 * backend does not implement yet - study duration, topic-level mastery,
 * unfinished-quiz resume - render an explicit unavailable or empty state
 * rather than a placeholder number.
 */

export type DashboardViewProps = {
  dashboard: DashboardResponse;
  /** Used only to turn a subject name into a real subject id for quiz links. */
  subjects: Subject[];
  /** The month the dashboard data covers. */
  yearMonth: YearMonth;
  /** The latest month the user may navigate to. */
  currentMonth: YearMonth;
  today?: Date;
};

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof ChartUpIcon;
  iconClassName: string;
  cardClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  valueClassName?: string;
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
  cardClassName,
  textClassName,
  subtitleClassName,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className={`group rounded-2xl border border-line bg-primary-foreground p-4 shadow-sm shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cardClassName ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em]">
        <p className={textClassName ?? "text-primary/65"}>{title}</p>
        <div className={`rounded-xl p-2 ${iconClassName}`}>
          <HugeiconsIcon icon={icon} size={18} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={`text-3xl font-semibold break-words ${valueClassName ?? ""}`}>{value}</span>
        {subtitle ? (
          <span className={subtitleClassName ?? "text-xs leading-5 text-primary/65"}>
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-y-4 rounded-lg border border-line bg-primary-foreground p-4 transition-shadow hover:shadow-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-mono text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {description ? <p className="-mt-2 text-xs text-primary/70">{description}</p> : null}
      {children}
    </section>
  );
}

export function DashboardView({
  dashboard,
  subjects,
  yearMonth,
  currentMonth,
  today = new Date(),
}: DashboardViewProps) {
  const { user, overview, subject_mastery, areas_to_improve, unfinished_quizzes } = dashboard;

  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const activity = toDayActivity(dashboard.monthly_activity);
  const performance = deriveSubjectPerformance(subject_mastery);

  // `null` means the backend does not track study duration yet. It is not zero,
  // and must not be rendered as "0m".
  const studyTimeTracked = overview.total_duration_minutes !== null;

  const quizHrefForSubject = (subjectName: string) =>
    buildQuizSelectorHref(findSubjectByName(subjects, subjectName)?.id ?? null);

  return (
    <div className="flex flex-col gap-y-8">
      {/* Greeting */}
      <div className="overflow-hidden rounded-3xl border border-line bg-linear-to-br from-primary-foreground via-primary-foreground to-paper px-5 py-4 shadow-sm shadow-black/5 md:px-6 md:py-5">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
          <div className="flex flex-col gap-y-2.5">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-blue-600">
              <span>{formattedDate}</span>
              <span className="h-1 w-1 rounded-full bg-blue-600/50" aria-hidden="true" />
              <span>{greetingFor(today.getHours())}</span>
            </div>
            <h1 className="font-mono text-3xl font-semibold break-words text-ink md:text-4xl">
              Welcome {firstName}!
            </h1>
            <p className="max-w-2xl text-sm leading-5 text-primary/70">
              Your progress across every quiz you have submitted.
            </p>
          </div>

          <div className="flex justify-start lg:justify-end">
            <div className="flex w-full max-w-55 items-center gap-2 rounded-2xl border border-line bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
              <div className="rounded-xl bg-blue-600/10 p-1.5 text-blue-600">
                <HugeiconsIcon icon={Fire02Icon} size={16} className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.14em] text-primary/60">
                  Current streak
                </span>
                <span className="text-base font-semibold text-ink">
                  {overview.current_streak}-day streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview stats. All lifetime-to-date - the year/month only scopes the calendar. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Average Score"
          value={formatPercent(overview.average_score)}
          subtitle="Mean score across every quiz you have submitted."
          icon={ChartUpIcon}
          iconClassName="bg-white/15 text-white"
          cardClassName="!bg-blue-600 !border-blue-500/30 !shadow-blue-600/20 text-white"
          textClassName="text-white/85"
          subtitleClassName="text-xs leading-5 text-white/75"
          valueClassName="text-white"
        />
        <StatCard
          title="Accuracy"
          value={formatPercent(overview.accuracy)}
          subtitle="Correct answers out of every question you have answered."
          icon={Target02Icon}
          iconClassName="bg-blue-600/10 text-blue-600"
          valueClassName="text-emerald-700"
        />
        <StatCard
          title="Questions Solved"
          value={formatNumber(overview.total_questions_solved)}
          subtitle="Total questions across all your attempts."
          icon={Pen02Icon}
          iconClassName="bg-blue-600/10 text-blue-600"
        />
        <StatCard
          title="Study Time"
          value={
            studyTimeTracked ? formatDurationMinutes(overview.total_duration_minutes) : UNAVAILABLE
          }
          subtitle={
            studyTimeTracked
              ? "Time recorded across your attempts."
              : "Not tracked yet — EduVault does not record quiz duration."
          }
          icon={Clock01Icon}
          iconClassName="bg-primary/10 text-primary/70"
        />
      </div>

      <div className="grid gap-x-4 gap-y-8 lg:grid-cols-12">
        <div className="flex flex-col gap-y-8 lg:col-span-7">
          {/* Subject mastery */}
          <SectionCard title="Subject Mastery">
            {subject_mastery.length === 0 ? (
              <EmptyState
                title="No mastery data yet"
                message="Submit a quiz and EduVault will start tracking how you are doing in each subject."
                actionHref="/student/play-quiz"
                actionLabel="Start a quiz"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {subject_mastery.map((subject) => (
                  <article
                    key={subject.subject_name}
                    className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold break-words text-ink">
                          {subject.subject_name}
                        </h3>
                        <p className="mt-1 text-xs text-primary/60">
                          {formatPercent(subject.mastery_percentage)} mastery
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {formatPercent(subject.mastery_percentage)}
                      </span>
                    </div>

                    <ProgressPrimitive.Root value={subject.mastery_percentage}>
                      <ProgressTrack className="bg-blue-600/15">
                        <ProgressIndicator className="bg-blue-600" />
                      </ProgressTrack>
                    </ProgressPrimitive.Root>

                    {/* Topic-level mastery is not implemented by the backend; it
                        always returns null, so nothing is invented here. */}
                    {subject.strongest_topic ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-paper/80 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.14em] text-primary/60">
                            Strongest topic
                          </p>
                          <p className="text-sm font-medium break-words text-ink">
                            {subject.strongest_topic.topic_name}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary/70">
                          {formatPercent(subject.strongest_topic.mastery_percentage)}
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-auto border-t border-line pt-4">
                      <Link
                        href={quizHrefForSubject(subject.subject_name)}
                        className="inline-flex w-fit items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Practice subject
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Unfinished quizzes */}
          <SectionCard title="Unfinished quizzes">
            {unfinished_quizzes.length === 0 ? (
              <EmptyState
                title="Nothing left unfinished"
                message="EduVault records a quiz when you submit it. Partly answered quizzes are not saved for later yet."
                actionHref="/student/play-quiz"
                actionLabel="Start a quiz"
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {unfinished_quizzes.map((quiz) => (
                  <li
                    key={quiz.quiz_id}
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
                  >
                    <span className="text-sm font-semibold break-words text-ink">{quiz.title}</span>

                    <div className="flex items-center gap-3">
                      <ProgressPrimitive.Root
                        value={quiz.progress_percentage}
                        className="flex-1"
                        aria-label={`${quiz.title} progress`}
                      >
                        <ProgressTrack className="bg-blue-600/15">
                          <ProgressIndicator className="bg-blue-600" />
                        </ProgressTrack>
                      </ProgressPrimitive.Root>
                      <span className="text-xs font-semibold text-ink">
                        {formatPercent(quiz.progress_percentage)}
                      </span>
                    </div>

                    <span className="text-sm text-primary/80">
                      {quiz.answered_questions} / {quiz.total_questions} questions answered
                    </span>
                    <span className="text-xs text-primary/60">
                      Last activity: {formatDateTime(quiz.last_activity_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-y-8 lg:col-span-5">
          {/* Derived subject performance. Not a WASSCE-readiness score - the
              backend exposes no readiness metric. */}
          <SectionCard
            title="Subject Performance"
            description="Ranked from the mastery percentages EduVault has recorded for you."
          >
            {subject_mastery.length === 0 ? (
              <EmptyState
                title="No subject performance yet"
                message="Once you submit a quiz your subjects will be ranked here."
              />
            ) : (
              <>
                <div className="rounded-2xl border border-line bg-white p-4">
                  <ul className="flex flex-col gap-4">
                    {subject_mastery.map((subject) => (
                      <li
                        key={subject.subject_name}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.2fr)_48px] items-center gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium text-ink">
                          {subject.subject_name}
                        </span>
                        <ProgressPrimitive.Root
                          value={subject.mastery_percentage}
                          aria-label={`${subject.subject_name} mastery`}
                        >
                          <ProgressTrack className="bg-blue-600/20">
                            <ProgressIndicator className="bg-blue-600" />
                          </ProgressTrack>
                        </ProgressPrimitive.Root>
                        <span className="text-right font-mono text-ink">
                          {formatPercent(subject.mastery_percentage)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-line bg-white p-4 text-sm text-primary/80">
                  <p className="font-semibold text-ink">
                    Average mastery:{" "}
                    <span className="font-normal text-primary/80">
                      {formatPercent(performance.averageMastery)}
                    </span>
                  </p>
                  {performance.strongest ? (
                    <p className="mt-3 font-semibold text-ink">
                      Strongest:{" "}
                      <span className="font-normal break-words text-primary/80">
                        {performance.strongest.subject_name} (
                        {formatPercent(performance.strongest.mastery_percentage)})
                      </span>
                    </p>
                  ) : null}
                  {performance.weakest ? (
                    <p className="mt-3 font-semibold text-ink">
                      Needs attention:{" "}
                      <span className="font-normal break-words text-primary/80">
                        {performance.weakest.subject_name} (
                        {formatPercent(performance.weakest.mastery_percentage)})
                      </span>
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </SectionCard>

          {/* Areas to improve */}
          <SectionCard
            title="Areas to improve"
            description="Subjects where your mastery is still below EduVault's threshold."
          >
            {areas_to_improve.length === 0 ? (
              <EmptyState
                title="No improvement areas identified yet"
                message="Nothing has fallen below the mastery threshold. Keep practising to keep it that way."
              />
            ) : (
              <ul className="flex flex-col gap-y-4">
                {areas_to_improve.map((area) => (
                  <li
                    key={area.subject_name}
                    className="flex flex-col gap-y-3 rounded-2xl border border-line bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-y-1">
                        <span className="text-sm font-semibold break-words text-ink">
                          {area.subject_name}
                        </span>
                        <span className="text-xs text-primary/70">
                          {formatPercent(area.mastery_percentage)} mastery
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-600">
                        Needs work
                      </span>
                    </div>
                    <Link
                      href={quizHrefForSubject(area.subject_name)}
                      className="inline-flex w-fit items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Practice subject
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Monthly activity */}
          <SectionCard
            title="Monthly activity"
            description={`Quizzes you submitted in ${monthLabel(yearMonth)}.`}
          >
            <StreakHeatmap
              activity={activity}
              yearMonth={yearMonth}
              currentMonth={currentMonth}
              today={today}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
