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
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 flex flex-col gap-y-4">
            <div className="bg-paper border border-line rounded-lg hover:shadow-xl p-4 flex flex-col gap-y-4">
              <div className="flex gap-x-4 justify-between items-baseline">
                <h4 className="font-mono font-semibold text-2xl">
                  Subject Mastery
                </h4>
                <Link
                  href={"/student"}
                  className="text-green text-xs hover:underline"
                >
                  See all subjects
                </Link>
              </div>
              <p>Hello World</p>
              <p>Hello World</p>
            </div>
          </div>
          <div className="col-span-5 flex flex-col gap-y-4">World</div>
        </div>
      </section>
    </>
  );
};

export default Student_Dashboard;
