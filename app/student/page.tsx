import { cookies } from "next/headers";
import { Button } from "~/components/ui/button";

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

const Student_Dashboard = async () => {
  const cookieStore = await cookies();
  const dataCookie = cookieStore.get("data")?.value;
  const username = dataCookie ? JSON.parse(dataCookie) : null;

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

  return (
    <>
      <section className="flex flex-col gap-y-8">
        {/* Greetings */}
        <div className="flex flex-col gap-y-4">
          <p className="font-space text-xs text-green uppercase">{formatted}</p>
          <h1 className="font-mono text-3xl font-semibold text-ink">
            {greeting}, {username.name}.
          </h1>
        </div>

        {/* Last Unfinished Quiz */}
        <div className="p-6 bg-navy rounded-lg continue-card text-white flex flex-col lg:flex-row gap-8 lg:justify-between lg:items-center">
          <div className="flex flex-col gap-y-6">
            <p className="font-space text-xs text-green-pale uppercase">
              continue where you stopped
            </p>
            <h3 className="font-mono text-2xl font-semibold">
              Integrated Science · 2023 · Paper 1
            </h3>
            <div className="flex flex-col gap-y-4">
              <p className="font-space flex gap-x-4 text-sm text-white/80">
                <span>Q10 of 40</span>
                <span>·</span>
                <span>Started 20 minutes ago</span>
              </p>
              <ProgressPrimitive.Root value={51}>
                <ProgressTrack className="bg-green-pale/20">
                  <ProgressIndicator className="bg-green-pale" />
                </ProgressTrack>
              </ProgressPrimitive.Root>
            </div>
          </div>
          <Button variant={"white_navy"}>Resume Paper</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-y-6 border border-line bg-paper p-4 rounded-lg hover:shadow-xl">
            <div className="flex gap-x-4 justify-between items-center text-xs uppercase font-space">
              <p className="text-primary/70">Average Score</p>
              <div className="p-2 bg-green/10 rounded-lg text-green">
                <HugeiconsIcon icon={ChartUpIcon} size={18} />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-3xl font-semibold">68%</span>
            </div>
          </div>
          <div className="flex flex-col gap-y-6 border border-line bg-paper p-4 rounded-lg hover:shadow-xl">
            <div className="flex gap-x-4 justify-between items-center text-xs uppercase font-space">
              <p className="text-primary/70">Days Streak</p>
              <div className="p-2 bg-orange-600/10 rounded-lg text-orange-600">
                <HugeiconsIcon icon={Fire02Icon} size={18} />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-3xl font-semibold">6</span>
              <span className="text-xs">Practice today to keep it</span>
            </div>
          </div>
          <div className="flex flex-col gap-y-6 border border-line bg-paper p-4 rounded-lg hover:shadow-xl">
            <div className="flex gap-x-4 justify-between items-center text-xs uppercase font-space">
              <p className="text-primary/70">Questions Done</p>
              <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
                <HugeiconsIcon icon={Pen02Icon} size={18} />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-3xl font-semibold">328</span>
            </div>
          </div>
          <div className="flex flex-col gap-y-6 border border-line bg-paper p-4 rounded-lg hover:shadow-xl">
            <div className="flex gap-x-4 justify-between items-center text-xs uppercase font-space">
              <p className="text-primary/70">Tutor Replies</p>
              <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
                <HugeiconsIcon icon={Mail01Icon} size={18} />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="text-3xl font-semibold">2</span>
              <span className="text-xs">Tiny comment</span>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="grid lg:grid-cols-12 gap-x-4 gap-y-8">
          <div className="lg:col-span-7 flex flex-col gap-y-8">
            <div className="bg-paper border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-6">
              <div className="flex gap-x-4 justify-between items-baseline">
                <h4 className="font-mono font-semibold text-xl">
                  Subject Mastery
                </h4>
                <Link
                  href={"/student"}
                  className="text-green text-xs hover:underline font-space"
                >
                  See all subjects
                </Link>
              </div>

              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Integrated Science</span>
                  <span className="text-xs font-space text-primary/70">
                    340 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={75}>
                  <ProgressTrack className="bg-green/20">
                    <ProgressIndicator className="bg-green" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  75%
                </span>
              </div>
              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Core Mathematics</span>
                  <span className="text-xs font-space text-primary/70">
                    620 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={85}>
                  <ProgressTrack className="bg-green/20">
                    <ProgressIndicator className="bg-green" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  85%
                </span>
              </div>
              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">English Language</span>
                  <span className="text-xs font-space text-primary/70">
                    430 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={52}>
                  <ProgressTrack className="bg-green/20">
                    <ProgressIndicator className="bg-green" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  52%
                </span>
              </div>
              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Chemistry</span>
                  <span className="text-xs font-space text-primary/70">
                    340 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={45}>
                  <ProgressTrack className="bg-red/20">
                    <ProgressIndicator className="bg-red" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  45%
                </span>
              </div>
              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Physics</span>
                  <span className="text-xs font-space text-primary/70">
                    320 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={65}>
                  <ProgressTrack className="bg-green/20">
                    <ProgressIndicator className="bg-green" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  65%
                </span>
              </div>

              {/* Subject Row */}
              <div className="pb-4 border-b border-line grid grid-cols-[1fr_120px_60px] gap-2 items-center last:border-0">
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Elective Maths</span>
                  <span className="text-xs font-space text-primary/70">
                    830 attempted
                  </span>
                </div>
                <ProgressPrimitive.Root value={95}>
                  <ProgressTrack className="bg-green/20">
                    <ProgressIndicator className="bg-green" />
                  </ProgressTrack>
                </ProgressPrimitive.Root>

                <span className="font-semibold font-mono flex items-center justify-end">
                  95%
                </span>
              </div>
            </div>

            {/* Script Review */}
            <div className="bg-paper border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-6">
              <div className="flex gap-x-4 justify-between items-baseline">
                <h4 className="font-mono font-semibold text-xl">
                  Recent Scripts
                </h4>
                <Link
                  href={"/student"}
                  className="text-green text-xs hover:underline font-space"
                >
                  Full history
                </Link>
              </div>
              {/* Script Row */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-center p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full border-3 text-green border-green flex items-center justify-center font-semibold font-mono">
                  78%
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">
                    Core Maths · 2024 · Paper 2
                  </span>
                  <span className="text-xs font-space text-primary/70">
                    32/40 correct
                  </span>
                </div>
                <div className="flex justify-end">
                  <Link
                    href={"/student"}
                    className="text-green text-xs hover:underline font-space"
                  >
                    Review with AI
                  </Link>
                </div>
              </div>
              {/* Script Row */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-center p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full border-3 text-red border-red flex items-center justify-center font-semibold font-mono">
                  44%
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">
                    Physics · 2021 · Paper 2
                  </span>
                  <span className="text-xs font-space text-primary/70">
                    11/25 correct
                  </span>
                </div>
                <div className="flex justify-end">
                  <Link
                    href={"/student"}
                    className="text-green text-xs hover:underline font-space"
                  >
                    Review with AI
                  </Link>
                </div>
              </div>
              {/* Script Row */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-center p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full border-3 text-green border-green flex items-center justify-center font-semibold font-mono">
                  81%
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">
                    English Language · 2023 · Paper 3
                  </span>
                  <span className="text-xs font-space text-primary/70">
                    32/40 correct
                  </span>
                </div>
                <div className="flex justify-end">
                  <Link
                    href={"/student"}
                    className="text-green text-xs hover:underline font-space"
                  >
                    Review with AI
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Second Side of the board */}
          <div className="lg:col-span-5 flex flex-col gap-y-8">
            {/* Messages From Tutor */}
            <div className="bg-paper border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-6">
              <div className="flex gap-x-4 justify-between items-baseline">
                <h4 className="font-mono font-semibold text-xl">
                  Messages from your tutors
                </h4>
              </div>
              {/* Message Row */}
              <div className="cursor-pointer grid grid-cols-[auto_1fr_auto] gap-x-4 p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full text-green-pale bg-navy flex items-center justify-center font-semibold">
                  JB
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Mr. Boateng</span>
                  <span className="text-xs font-space text-primary/70">
                    Redo Q7–9 on logs before we speak — you&apos;re close.
                  </span>
                </div>
                <div className="flex justify-end">
                  <div className="bg-red p-1 rounded-full h-fit w-fit"></div>
                </div>
              </div>
              {/* Message Row */}
              <div className="cursor-pointer grid grid-cols-[auto_1fr_auto] gap-x-4 p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full text-green-pale bg-navy flex items-center justify-center font-semibold">
                  BA
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Mrs. Asante</span>
                  <span className="text-xs font-space text-primary/70">
                    Good improvement on circuits this week 👏
                  </span>
                </div>
                <div className="flex justify-end">
                  <div className="bg-red p-1 rounded-full h-fit w-fit"></div>
                </div>
              </div>
              {/* Message Row */}
              <div className="cursor-pointer grid grid-cols-[auto_1fr_auto] gap-x-4 p-4 border border-line rounded-lg bg-white">
                <div className="h-13 w-13 rounded-full text-green-pale bg-navy flex items-center justify-center font-semibold">
                  WB
                </div>
                <div className="flex flex-col gap-y-2">
                  <span className="font-semibold">Mr. Banang-ere</span>
                  <span className="text-xs font-space text-primary/70">
                    Good improvement on circuits this week 👏
                  </span>
                </div>
                <div className="flex justify-end">
                  <div className="bg-red p-1 rounded-full h-fit w-fit"></div>
                </div>
              </div>
            </div>
            {/* Streak count */}
            <div className="bg-paper border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-6">
              <div className="flex flex-col gap-y-2 justify-between items-baseline">
                <h4 className="font-mono font-semibold">This week</h4>
                <p className="font-space text-xs">
                  Practiced 5 of the last 7 days
                </p>
              </div>
              {/* Message Row */}
              <div className="grid grid-cols-7 gap-x-4">
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  M
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  t
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  w
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  t
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  f
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  s
                </p>
                <p className="w-8 h-8 sm:h-10 sm:w-10 bg-green rounded-lg text-white font-medium flex items-center justify-center uppercase">
                  s
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Student_Dashboard;
