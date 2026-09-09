import { cookies } from "next/headers";
import Link from "next/link";

import ChatAiClient from "~/components/chat-ai/chat-ai-client";
import { REVIEW_QUEUE_COOKIE } from "~/lib/auth/session";
import { parseReviewQueue, unresolvedItems } from "~/lib/quiz/review-queue";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI review | EduVault",
};

/**
 * AI review queue.
 *
 * The queue is read from an HTTP-only cookie written by the submit-quiz route
 * from the backend's own `wrong_questions`. Only questions the student
 * actually answered incorrectly can be explained - `POST /ai/explain` needs a
 * recorded StudentAnswer, so unanswered questions never enter this queue.
 */
const Chat_Ai = async () => {
  const cookieStore = await cookies();
  const queue = parseReviewQueue(cookieStore.get(REVIEW_QUEUE_COOKIE)?.value);
  const pending = unresolvedItems(queue);

  if (queue.length === 0) {
    return (
      <section className="mx-2 flex min-h-[55vh] w-full max-w-5xl flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:mx-4 md:mx-auto md:p-10">
        <div className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          AI Review Locked
        </div>

        <div className="space-y-3">
          <h1 className="font-mono text-2xl font-semibold text-ink md:text-3xl">
            Attempt a quiz to unlock the AI review
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-primary/70 md:text-base">
            Complete a quiz with at least one incorrect answer, then come back here for a
            worked-through explanation of each one.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/student/play-quiz"
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
          >
            Start a quiz now
          </Link>
          <Link
            href="/student"
            className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (pending.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-green-50 via-white to-paper p-6 shadow-sm shadow-black/5 md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-green-200/55 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-white/80 p-6 text-center shadow-sm backdrop-blur md:p-10">
          <div className="rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Great Progress
          </div>

          <div className="space-y-3">
            <h1 className="font-mono text-2xl font-semibold text-ink md:text-3xl">
              All {queue.length} missed question{queue.length === 1 ? "" : "s"} reviewed
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-6 text-primary/70 md:text-base">
              You have worked through every explanation from your last attempt.
            </p>
          </div>

          <Link
            href="/student/play-quiz"
            className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Attempt another quiz
          </Link>
        </div>
      </section>
    );
  }

  return (
    <ChatAiClient
      key={`${pending[0].attempt_id}-${pending[0].question_id}`}
      pending={pending}
      totalCount={queue.length}
      resolvedCount={queue.length - pending.length}
    />
  );
};

export default Chat_Ai;
