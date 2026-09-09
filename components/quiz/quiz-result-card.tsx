"use client";

import { Button } from "../ui/button";
import type { SubmitPaperResponse } from "~/lib/api/schemas";
import { formatPercent } from "~/lib/format";

type QuizResultsCardProps = {
  results: SubmitPaperResponse;
  /** Questions the student left blank. Counted wrong, but not AI-reviewable. */
  unansweredCount: number;
  onRestart: () => void;
  onDashboard: () => void;
  onAI: () => void;
};

/**
 * Result summary, straight from `POST /papers/submit`.
 *
 * The AI-review queue used to be written here with `document.cookie`. It is
 * now built server-side by the submit route from the backend's own
 * `wrong_questions`, so this component only displays results.
 */
export default function Quiz_Results_Card({
  results,
  unansweredCount,
  onRestart,
  onDashboard,
  onAI,
}: QuizResultsCardProps) {
  const reviewableCount = results.wrong_questions.length;

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-y-6 rounded-2xl border bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground text-3xl font-bold">
          🎉
        </div>
        <h1 className="text-2xl font-bold text-blue-600">Quiz submitted</h1>
        <p className="text-primary/70">Here is how you did on this paper.</p>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-primary-foreground p-4 text-left">
          <div className="text-primary/70">
            <dt className="inline">Total questions: </dt>
            <dd className="inline font-semibold text-blue-600">{results.total_questions}</dd>
          </div>
          <div className="text-primary/70">
            <dt className="inline">Correct: </dt>
            <dd className="inline font-semibold text-blue-600">{results.correct}</dd>
          </div>
          <div className="text-primary/70">
            <dt className="inline">Wrong: </dt>
            <dd className="inline font-semibold text-blue-600">{results.wrong}</dd>
          </div>
          <div className="text-primary/70">
            <dt className="inline">Score: </dt>
            <dd className="inline font-semibold text-blue-600">
              {results.score}/{results.total_questions}
            </dd>
          </div>
          <div className="col-span-full text-primary/70">
            <dt className="sr-only">Percentage</dt>
            <dd className="text-4xl font-semibold text-blue-600">
              {formatPercent(results.percentage, 2)}
            </dd>
          </div>
        </dl>

        {unansweredCount > 0 ? (
          <p className="text-sm text-primary/70">
            {unansweredCount} question{unansweredCount === 1 ? " was" : "s were"} left unanswered.
            EduVault counts {unansweredCount === 1 ? "it" : "them"} as wrong, and the AI review can
            only explain questions you actually answered.
          </p>
        ) : null}

        <div className="flex flex-col gap-y-3">
          <Button onClick={onAI} disabled={reviewableCount === 0}>
            {reviewableCount === 0
              ? "Nothing to review with AI"
              : `Review ${reviewableCount} missed question${reviewableCount === 1 ? "" : "s"} with AI`}
          </Button>
          <Button onClick={onRestart}>Try again</Button>
          <Button onClick={onDashboard} variant="outline">
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
