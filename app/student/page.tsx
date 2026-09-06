import { cookies } from "next/headers";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { ProgressTrack, ProgressIndicator } from "~/components/ui/progress";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartUpIcon,
  Fire02Icon,
  Mail01Icon,
  Pen02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { getCurrentStreak } from "~/components/dashboard/streak-utils";
import { DayActivity } from "~/components/dashboard/streak-utils";
import { StreakHeatmap } from "~/components/dashboard/heat-map";

const mockActivity: DayActivity[] = Array.from({ length: 365 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (364 - i));
  return {
    date: d.toISOString().slice(0, 10),
    count: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 20),
  };
});

type MasterySubject = {
  name: string;
  score: number;
  year: number;
  paper: string;
  topics: {
    name: string;
    score: number;
  }[];
};

const masterySubjects: MasterySubject[] = [
  {
    name: "Further Mathematics",
    score: 82,
    year: 2022,
    paper: "Paper 1",
    topics: [
      { name: "Algebra", score: 91 },
      { name: "Geometry", score: 76 },
      { name: "Statistics", score: 64 },
      { name: "Calculus", score: 52 },
    ],
  },
  {
    name: "Integrated Science",
    score: 75,
    year: 2024,
    paper: "Paper 1",
    topics: [
      { name: "Ecology", score: 84 },
      { name: "Energy", score: 73 },
      { name: "Forces", score: 68 },
      { name: "Human Biology", score: 57 },
    ],
  },
  {
    name: "Social Studies",
    score: 68,
    year: 2023,
    paper: "Paper 1",
    topics: [
      { name: "Comprehension", score: 79 },
      { name: "Summary Writing", score: 71 },
      { name: "Grammar", score: 66 },
      { name: "Essay Writing", score: 48 },
    ],
  },
  {
    name: "Chemistry",
    score: 61,
    year: 2023,
    paper: "Paper 1",
    topics: [
      { name: "Organic Chemistry", score: 42 },
      { name: "Stoichiometry", score: 55 },
      { name: "Acids and Bases", score: 63 },
      { name: "Periodic Trends", score: 71 },
    ],
  },
];

const readinessRows: Array<[string, number]> = [
  ["Mathematics", 82],
  ["English", 71],
  ["Integrated Sci.", 63],
  ["Chemistry", 54],
];

const buildQuizHref = (subject: MasterySubject) =>
  `/student/play-quiz?subject=${subject.name.replaceAll(" ", "-")}&year=${subject.year}&paper=${subject.paper.replaceAll(" ", "-")}`;

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
        <span className={`text-3xl font-semibold ${valueClassName ?? ""}`}>
          {value}
        </span>
        {subtitle ? (
          <span
            className={subtitleClassName ?? "text-xs leading-5 text-primary/65"}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const Student_Dashboard = async () => {
  const cookieStore = await cookies();
  const dataCookie = cookieStore.get("data")?.value;
  const user = dataCookie ? JSON.parse(dataCookie) : null;

  const d = new Date();
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const getGreeting = (hour: number) => {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting(d.getHours());
  const currentStreak = getCurrentStreak(mockActivity, d);

  return (
    <>
      <section className="flex flex-col gap-y-8">
        {/* Greetings */}
        <div className="overflow-hidden rounded-3xl border border-line bg-linear-to-br from-primary-foreground via-primary-foreground to-paper px-5 py-4 shadow-sm shadow-black/5 md:px-6 md:py-5">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div className="flex flex-col gap-y-2.5">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-blue-600">
                <span>{formatted}</span>
                <span className="h-1 w-1 rounded-full bg-blue-600/50" />
                <span>{greeting}</span>
              </div>
              <h1 className="font-mono text-3xl font-semibold text-ink md:text-4xl">
                Welcome {user?.name.split(" ")[0] ?? "Student"}!
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-primary/70">
                Track progress, accuracy, and tutor feedback at a glance.
              </p>
            </div>

            <div className="flex justify-start lg:justify-end">
              <div className="flex w-full max-w-55 items-center gap-2 rounded-2xl border border-line bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
                <div className="rounded-xl bg-blue-600/10 p-1.5 text-blue-600">
                  <HugeiconsIcon
                    icon={Fire02Icon}
                    size={16}
                    className="text-blue-600"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-primary/60">
                    Current streak
                  </span>
                  <span className="text-base font-semibold text-ink">
                    {currentStreak}-day streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Average Score"
            value="68%"
            subtitle="Average across your recent quizzes. Keep practicing to reach 80%+."
            icon={ChartUpIcon}
            iconClassName="bg-white/15 text-white"
            cardClassName="!bg-blue-600 !border-blue-500/30 !shadow-blue-600/20 text-white"
            textClassName="text-white/85"
            subtitleClassName="text-xs leading-5 text-white/75"
            valueClassName="text-white"
          />
          <StatCard
            title="Accuracy"
            value="76%"
            icon={ChartUpIcon}
            iconClassName="bg-blue-600/10 text-blue-600"
            valueClassName="text-emerald-700"
          />
          <StatCard
            title="Questions Done"
            value="328"
            icon={Pen02Icon}
            iconClassName="bg-blue-600/10 text-blue-600"
          />
          <StatCard
            title="Study Time"
            value="18h 42m"
            subtitle="This week"
            icon={Mail01Icon}
            iconClassName="bg-red-600/10 text-red-600"
          />
        </div>

        {/* Board */}
        <div className="grid lg:grid-cols-12 gap-x-4 gap-y-8">
          <div className="lg:col-span-7 flex flex-col gap-y-8">
            <div className="bg-primary-foreground border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-6">
              <div className="flex gap-x-4 justify-between items-baseline">
                <h4 className="font-mono font-semibold text-xl">
                  Subject Mastery
                </h4>
                <Link
                  href={"/student"}
                  className="text-blue-600 text-xs hover:underline "
                >
                  See all subjects
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {masterySubjects.map((subject) => (
                  <div
                    key={subject.name}
                    className="group rounded-2xl border border-line bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={buildQuizHref(subject)}
                          className="block text-base font-semibold text-ink transition-colors hover:text-blue-600"
                        >
                          {subject.name} — {subject.score}%
                        </Link>
                        <p className="mt-1 text-xs text-primary/60">
                          {subject.year} {subject.paper}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Open
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {subject.topics.map((topic) => {
                        const isWeakest =
                          topic.score ===
                          Math.min(...subject.topics.map((item) => item.score));

                        return (
                          <div
                            key={topic.name}
                            className="flex items-center justify-between gap-3 rounded-xl bg-paper/80 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">
                                {topic.name}
                              </p>
                              <p className="text-xs text-primary/60">
                                {topic.score}% mastery
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                isWeakest
                                  ? "bg-red-600/10 text-red-600"
                                  : "bg-primary/10 text-primary/70"
                              }`}
                            >
                              {topic.score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                      <Link
                        href={buildQuizHref(subject)}
                        className="inline-flex w-fit items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        Practice weakest topic →
                      </Link>
                      <p className="text-xs text-primary/60">
                        Start with the lowest-scoring topic in this subject.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue quiz */}
            <div className="bg-primary-foreground border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="font-mono font-semibold text-xl">
                  Continue unfinished quiz
                </h4>
                <Link
                  href={"/student/play-quiz"}
                  className="text-blue-600 text-xs hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-ink">
                      Mathematics — WASSCE 2024 Paper 2
                    </span>
                    <span className="text-xs text-primary/70">
                      Resume where you stopped
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-4/5 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-ink">80%</span>
                  </div>

                  <span className="text-sm font-semibold text-ink">
                    16 / 20 questions completed
                  </span>

                  <Link
                    href={"/student/play-quiz"}
                    className="inline-flex w-fit items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    Continue Quiz →
                  </Link>

                  <p className="text-xs text-primary/60">
                    Last studied: 12 minutes ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Second Side of the board */}
          <div className="lg:col-span-5 flex flex-col gap-y-8">
            {/* WASSCE Readiness */}
            <div className="bg-primary-foreground border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-5">
              <div className="flex flex-col gap-y-2">
                <h4 className="font-mono font-semibold text-2xl">
                  WASSCE Readiness
                </h4>
                <p className="text-sm text-primary/70">
                  Overall readiness:{" "}
                  <span className="font-semibold text-ink">68%</span>
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-col gap-4">
                  {readinessRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1fr_minmax(120px,1.2fr)_48px] items-center gap-3 text-sm"
                    >
                      <span className="font-medium text-ink">{label}</span>
                      <ProgressPrimitive.Root value={value}>
                        <ProgressTrack className="bg-blue-600/20">
                          <ProgressIndicator className="bg-blue-600" />
                        </ProgressTrack>
                      </ProgressPrimitive.Root>
                      <span className="font-mono text-right text-ink">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 text-sm text-primary/80">
                <p className="font-semibold text-ink">
                  Estimated readiness:{" "}
                  <span className="font-normal text-primary/80">Moderate</span>
                </p>
                <p className="mt-3 font-semibold text-ink">
                  Strongest:{" "}
                  <span className="font-normal text-primary/80">
                    Mathematics
                  </span>
                </p>
                <p className="mt-3 font-semibold text-ink">
                  Needs attention:{" "}
                  <span className="font-normal text-primary/80">Chemistry</span>
                </p>
              </div>
            </div>
            {/* Areas to improve */}
            <div className="bg-primary-foreground border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <h4 className="font-mono font-semibold text-2xl">
                  Areas to improve
                </h4>
                <p className="text-xs text-primary/70">
                  Focus on the topics with the lowest mastery first.
                </p>
              </div>

              <div className="flex flex-col gap-y-3 rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-y-1">
                    <span className="text-sm font-semibold text-ink">
                      Chemistry
                    </span>
                    <span className="text-xs text-primary/70">
                      Organic Chemistry — 42% mastery
                    </span>
                  </div>
                  <span className="rounded-full bg-red-600/10 px-2.5 py-1 text-xs font-medium text-red-600">
                    Needs work
                  </span>
                </div>
                <p className="text-xs text-primary/70">18 questions answered</p>
                <Link
                  href="/student/play-quiz"
                  className="inline-flex w-fit items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Practice now →
                </Link>
              </div>

              <div className="flex flex-col gap-y-3 rounded-2xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-y-1">
                    <span className="text-sm font-semibold text-ink">
                      Mathematics
                    </span>
                    <span className="text-xs text-primary/70">
                      Probability — 51% mastery
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-600/10 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Warm up
                  </span>
                </div>
                <p className="text-xs text-primary/70">
                  12 questions available
                </p>
              </div>
            </div>

            {/* Heat Map Section */}
            <div className="bg-primary-foreground border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <h4 className="font-mono font-semibold text-2xl">
                  Monthly activity
                </h4>
                <p className="text-xs text-primary/70">
                  Slide through months to review study activity.
                </p>
              </div>

              <StreakHeatmap activity={mockActivity} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Student_Dashboard;
