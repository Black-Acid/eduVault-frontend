import { Calendar01Icon, Sparkles, TrendingUp } from "@hugeicons/core-free-icons";
import { IconSvgObject } from "@hugeicons/core-free-icons/types";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { ErrorState } from "~/components/general/states";
import { buttonVariants } from "~/components/ui/button";
import { toUserMessage } from "~/lib/api/errors";
import type { Subject } from "~/lib/api/schemas";
import { getSubjects, yearsForSubject } from "~/lib/api/subjects";
import { pluralize } from "~/lib/format";

export const metadata = {
  title: "EduVault — Practise WASSCE past questions",
  description:
    "Free WASSCE past-question practice with instant AI explanations for every answer you get wrong, plus tutoring sessions with real tutors.",
};

type FeatureType = {
  icon: IconSvgObject;
  headline: string;
  description: string;
};

/**
 * Product claims on this page are limited to what the backend actually does:
 * quizzes from real past papers, saved attempts, AI explanations for wrong
 * answers, and tutor session booking. There is no messaging, no quiz resume
 * and no untimed mode, so none are advertised.
 */
const FEATURES: FeatureType[] = [
  {
    icon: Sparkles,
    headline: "Free WASSCE quizzes",
    description:
      "Practise real past-paper questions from EduVault's library of subjects and exam years, at no cost.",
  },
  {
    icon: TrendingUp,
    headline: "Track your marks",
    description:
      "Every quiz you submit is saved, then scored into your accuracy, streak and subject mastery.",
  },
  {
    icon: Calendar01Icon,
    headline: "Book a tutor",
    description:
      "Send a session request to a subject tutor, and join the video call once they accept it.",
  },
];

const HOW_IT_WORKS: { headline: string; description: string }[] = [
  {
    headline: "Pick a paper",
    description: "Choose your subject, then the exam year and paper from real WASSCE past questions.",
  },
  {
    headline: "Attempt it",
    description: "Work through the paper one question at a time, with a timer on each question.",
  },
  {
    headline: "AI reviews you",
    description:
      "Every question you answered incorrectly gets a worked-through explanation of what went wrong.",
  },
  {
    headline: "Book a tutor",
    description: "Still stuck? Request a session with a tutor who teaches that subject.",
  },
];

function SubjectCoverage({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <div className="col-span-full">
        <ErrorState
          title="Subject coverage is unavailable"
          message="We could not load EduVault's subject list right now. Please try again shortly."
        />
      </div>
    );
  }

  return (
    <>
      {subjects.map((subject) => {
        const years = yearsForSubject(subject);
        const paperCount = subject.papers.length;

        return (
          <div
            key={subject.id}
            className="flex flex-col gap-y-3 rounded-lg border border-blue-600/40 bg-primary-foreground p-4"
          >
            <h3 className="font-mono text-xl font-semibold text-primary hyphens-auto sm:text-2xl">
              {subject.name}
            </h3>
            <p className="text-primary/80">
              {paperCount} {pluralize(paperCount, "paper")}
            </p>
            {years.length > 0 ? (
              <p className="text-sm text-primary/60">
                {years.length === 1 ? years[0] : `${years[years.length - 1]}–${years[0]}`}
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export default async function Home() {
  let subjects: Subject[] = [];
  let subjectsError: string | null = null;

  try {
    subjects = await getSubjects();
  } catch (error) {
    subjectsError = toUserMessage(error);
  }

  return (
    <>
      <section className="grid gap-16 py-10 lg:grid-cols-11">
        <div className="flex flex-col gap-y-8 lg:col-span-6">
          <p className="w-fit rounded-full border border-dashed border-blue-600 bg-primary-foreground px-2 py-1 text-xs font-medium uppercase text-blue-600">
            Built for Ghanaian Students
          </p>
          <div className="flex flex-col gap-y-4">
            <h1 className="max-w-3xl font-mono text-5xl font-semibold leading-normal">
              Practice WASSCE. <span className="text-blue-600">Track every mark.</span>
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-primary/80">
              Free past-question quizzes, saved results, and an AI review that explains every
              question you got wrong — plus tutors you can book when you want to talk it through
              with a person.
            </p>
          </div>
          {/* Plain links styled as buttons: these navigate, so they must keep
              link semantics rather than being announced as buttons. */}
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/signup" className={buttonVariants()}>
              Get started as a student
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: "outline" })}>
              I&apos;m a tutor
            </Link>
          </div>
        </div>
        <div className="flex items-center lg:col-span-5">
          <Image
            height={1000}
            width={1000}
            src="/hero.png"
            quality={100}
            alt="A senior high school student preparing for her exams"
            className="h-full max-h-150 w-full rounded-lg object-cover transition-all duration-200 hover:grayscale-0 lg:max-h-100 lg:w-auto lg:grayscale-100"
          />
        </div>
      </section>

      <section className="-mx-4 grid gap-4 bg-primary-foreground px-4 py-20 lg:grid-cols-3 lg:gap-8">
        <p className="col-span-full w-fit rounded-full border border-dashed border-blue-600 bg-primary-foreground px-2 py-1 text-xs font-medium uppercase text-blue-600">
          The features
        </p>
        <h2 className="col-span-full max-w-xl font-mono text-4xl font-semibold">
          Everything you <span className="text-blue-600">need</span> before{" "}
          <span className="text-blue-600">results day</span>
        </h2>
        <p className="col-span-full max-w-2xl text-lg text-primary/80">
          Practise real past papers, see where you stand in each subject, and get a clear
          explanation whenever you get something wrong.
        </p>
        {FEATURES.map(({ description, headline, icon }) => (
          <div
            key={headline}
            className="flex flex-col gap-y-4 rounded-lg border border-blue-600/70 bg-primary-foreground p-4 lg:gap-y-8 lg:p-8"
          >
            <HugeiconsIcon icon={icon} strokeWidth={1} color="#4f39f6" size={56} />
            <h3 className="font-mono text-3xl font-semibold text-primary/90 md:text-2xl lg:text-3xl">
              {headline}
            </h3>
            <p className="text-lg text-primary/70">{description}</p>
          </div>
        ))}
      </section>

      <section className="-mx-4 -mt-20 grid gap-8 bg-primary px-4 py-20 text-white/80 md:grid-cols-2">
        <p className="col-span-full w-fit rounded-full border border-dashed border-blue-600 bg-primary px-2 py-1 text-xs font-medium uppercase text-blue-600">
          The flow
        </p>
        <h2 className="col-span-full font-mono text-4xl font-semibold">
          From past question to understanding
        </h2>
        <p className="col-span-full max-w-2xl text-lg">
          Four steps, start to finish — no dead ends when you get something wrong.
        </p>
        {HOW_IT_WORKS.map(({ description, headline }, index) => (
          <div key={headline} className="flex flex-col gap-y-4">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-600/60 text-xl text-blue-600/60"
            >
              {index + 1}
            </div>
            <h3 className="font-mono text-2xl font-semibold text-white">{headline}</h3>
            <p className="max-w-sm">{description}</p>
          </div>
        ))}
      </section>

      {/* Coverage comes straight from GET /subjects. No question totals: the
          endpoint does not expose them. No Core/Elective split: the backend
          does not classify subjects. */}
      <section className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
        <p className="col-span-full w-fit rounded-full border border-dashed border-blue-600 bg-primary-foreground px-2 py-1 text-xs font-medium uppercase text-blue-600">
          Coverage
        </p>
        <h2 className="col-span-full font-mono text-4xl font-semibold">
          The subjects on EduVault today
        </h2>
        <p className="col-span-full max-w-2xl text-lg text-primary/80">
          Past questions organised by subject, exam year and paper.
        </p>
        {subjectsError ? (
          <div className="col-span-full">
            <ErrorState title="Subject coverage is unavailable" message={subjectsError} />
          </div>
        ) : (
          <SubjectCoverage subjects={subjects} />
        )}
      </section>

      <section className="-mx-4 flex flex-col items-center gap-y-8 bg-blue-600 px-4 py-20 text-white/80">
        <p className="w-fit rounded-full border border-dashed border-white bg-white/10 px-2 py-1 text-xs font-medium uppercase text-white">
          Get started
        </p>
        <h2 className="text-center font-mono text-4xl font-semibold text-white">
          Stop guessing why you got it wrong
        </h2>
        <p className="max-w-2xl text-center text-lg">
          Turn past questions into real understanding, one explained answer at a time.
        </p>
        <Link
          href="/signup"
          className={buttonVariants({ variant: "outline", className: "hover:text-white" })}
        >
          Create your free account
        </Link>
      </section>
    </>
  );
}
