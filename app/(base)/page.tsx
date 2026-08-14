import {
  MessagesSquare,
  Sparkles,
  TrendingUp,
} from "@hugeicons/core-free-icons";
import { IconSvgObject } from "@hugeicons/core-free-icons/types";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";

type fetures_types = {
  icon: IconSvgObject;
  headline: string;
  description: string;
};

const FEATURES: fetures_types[] = [
  {
    icon: Sparkles,
    headline: "Free WASSCE quizzes",
    description:
      "Practice real exam-style questions across all four core subjects, at no cost.",
  },
  {
    icon: TrendingUp,
    headline: "Track your marks",
    description:
      "Every attempt is saved. See your scores improve and pick up right where you stopped.",
  },
  {
    icon: MessagesSquare,
    headline: "Message a tutor",
    description:
      "Stuck on a topic? Send a request to a subject tutor and get help directly in the app.",
  },
];

const how_it_works: { headline: string; description: string }[] = [
  {
    headline: "Pick a Paper",
    description:
      "Choose your subject and exam year from real WASSCE/BECE past questions.",
  },
  {
    headline: "Attempt it",
    description: "Answer under timed or untimed mode, just like the real exam.",
  },
  {
    headline: "AI reviews you",
    description:
      "Every wrong answer gets an instant, worked-through explanation.",
  },
  {
    headline: "Ask a tutor",
    description:
      "Still stuck? Chat a real tutor for that subject, right there.",
  },
];

const subjects: { type: "Core" | "Elective"; name: string; total: number }[] = [
  { type: "Core", name: "English", total: 1240 },
  { type: "Core", name: "Integrated Science", total: 1860 },
  { type: "Core", name: "Social Studies", total: 1540 },
  { type: "Elective", name: "Elective Maths", total: 1360 },
  { type: "Elective", name: "Physics", total: 1630 },
  { type: "Elective", name: "Chemistry", total: 1280 },
  { type: "Elective", name: "Biology", total: 1400 },
];

export default function Home() {
  return (
    <>
      <section className="grid lg:grid-cols-11 gap-16 py-10">
        <div className="lg:col-span-6 flex flex-col gap-y-8">
          <p className="rounded-full uppercase text-xs font-medium w-fit border-dashed text-blue-600 bg-primary-foreground px-2 py-1 border border-blue-600">
            Built for Ghanaian Students
          </p>
          <div className="flex flex-col gap-y-4">
            <h2 className="text-5xl font-mono leading-normal font-semibold max-w-3xl">
              Practice WASSCE.{" "}
              <span className="text-blue-600">Track every mark.</span>
            </h2>
            <p className="text-lg leading-relaxed text-primary/80 max-w-3xl">
              Free core-subject quizzes, saved progress, direct tutor support,
              and cutting-edge AI past question analysis provide a comprehensive
              suite of practice tests, milestone tracking, and expert guidance
              to help you overcome challenges, ensuring the ultimate confidence
              to walk into the WASSCE fully prepared.
            </p>
          </div>
          <div className="flex items-center gap-x-4">
            <Button>
              <Link href={"/login"}>Get Started as Student</Link>
            </Button>
            <Button variant={"outline"}>
              <Link href={"/signup"}>I&apos;m a Tutor</Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5 flex items-center">
          <Image
            height={1000}
            width={1000}
            src={"/hero.png"}
            quality={100}
            alt="Female SHS Student preparing herself for exams"
            className="object-cover w-full lg:w-auto h-full max-h-150 lg:max-h-100 rounded-lg lg:grayscale-100 hover:grayscale-0 transition-all duration-200"
          />
        </div>
      </section>
      <section className="grid lg:grid-cols-3 gap-4 lg:gap-8 py-20 bg-primary-foreground -mx-4 px-4">
        <p className="border-dashed col-span-full uppercase rounded-full text-xs font-medium w-fit text-blue-600 bg-primary-foreground px-2 py-1 border border-blue-600">
          The features
        </p>
        <h2 className="col-span-full text-4xl font-mono font-semibold max-w-xl">
          Everything you <span className="text-blue-600">need</span> before{" "}
          <span className="text-blue-600">results day</span>
        </h2>
        <p className="col-span-full text-lg max-w-2xl text-primary/80">
          Master core subjects, track your learning milestones, and get expert
          guidance with AI-driven tools designed to conquer difficult questions.
        </p>
        {FEATURES.map(({ description, headline, icon }) => (
          <div
            key={description}
            className="flex flex-col gap-y-4 lg:gap-y-8 rounded-lg border border-blue-600/70 bg-primary-foreground p-4 lg:p-8"
          >
            <HugeiconsIcon
              icon={icon}
              strokeWidth={1}
              color="#4f39f6"
              size={56}
            />
            <h3 className="text-3xl md:text-2xl lg:text-3xl font-semibold font-mono text-primary/90">
              {headline}
            </h3>
            <p className="text-lg text-primary/70">{description}</p>
          </div>
        ))}
      </section>
      <section className="py-20 bg-primary -mt-20 -mx-4 grid md:grid-cols-2 text-white/80 px-4 gap-8 md:gap-8">
        <p className="col-span-full uppercase rounded-full text-xs font-medium w-fit text-blue-600 bg-primary border-dashed px-2 py-1 border border-blue-600">
          The flow
        </p>
        <h2 className="col-span-full text-4xl font-mono font-semibold">
          From past question to understanding
        </h2>
        <p className="col-span-full text-lg max-w-2xl">
          Four steps, start to finish — no dead ends when you get something
          wrong.
        </p>
        {how_it_works.map(({ description, headline }, idx) => (
          <div key={headline} className="flex flex-col gap-y-4">
            <div className="w-16 h-16 text-blue-600/60 rounded-full flex items-center justify-center border-2 text-xl border-blue-600/60">
              <span>{idx + 1}</span>
            </div>
            <h3 className="text-2xl font-mono font-semibold text-white">
              {headline}
            </h3>
            <p className={"max-w-sm"}>{description}</p>
          </div>
        ))}
      </section>
      <section className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <p className="border-dashed col-span-full uppercase rounded-full text-xs font-medium w-fit text-blue-600 bg-primary-foreground px-2 py-1 border border-blue-600">
          Coverage
        </p>
        <h2 className="col-span-full text-4xl font-mono font-semibold">
          Every core and elective subject
        </h2>
        <p className="col-span-full text-lg max-w-2xl text-primary/80">
          Past questions pulled straight from WASSCE and BECE, organized by
          year.
        </p>
        {subjects.map(({ name, total, type }) => (
          <div
            key={name}
            className="p-4 border border-blue-600/40 rounded-lg bg-primary-foreground flex flex-col gap-y-4"
          >
            <p className="text-blue-600 text-sm">{type}</p>
            <h3 className="text-primary font-mono text-2xl font-semibold">
              {name}
            </h3>
            <p className="text-primary/80">{total} questions</p>
          </div>
        ))}
      </section>
      <section className="bg-blue-600 text-white/80 -mx-4 px-4 py-20 flex flex-col items-center gap-y-8">
        <p className="border-dashed col-span-full uppercase rounded-full text-xs font-medium w-fit text-white bg-white/10 px-2 py-1 border border-white">
          Get Started
        </p>
        <h2 className="col-span-full text-4xl font-mono font-semibold text-white">
          Stop guessing why you got it wrong
        </h2>
        <p className="col-span-full text-lg max-w-2xl">
          Join 12,400+ SHS students turning past questions into real
          understanding.
        </p>
        <Button variant={"outline"} className={"hover:text-white"}>
          <Link href={"/login"}>Get Started Now!</Link>
        </Button>
      </section>
    </>
  );
}
