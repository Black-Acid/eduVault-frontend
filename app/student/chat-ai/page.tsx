import { cookies } from "next/headers";
import ChatAiClient from "~/components/chat-ai/chat-ai-client";
import Link from "next/link";

const Chat_Ai = async () => {
  const cookieStore = await cookies();
  const dataCookie = cookieStore.get("quiz_results")?.value;
  const all_results = dataCookie ? JSON.parse(dataCookie) : null;

  if (!all_results) {
    return (
      <section className="mx-2 flex min-h-[55vh] w-full max-w-5xl flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:mx-4 md:mx-auto md:p-10">
        <div className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          AI Review Locked
        </div>

        <div className="space-y-3">
          <h2 className="font-mono text-2xl font-semibold text-ink md:text-3xl">
            Heyyy!!! You need to attempt a quiz to unlock the AI review.
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-6 text-primary/70 md:text-base">
            Complete one quiz first, then come back here to get clear AI
            explanations, concept hints, and targeted practice steps.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/student/play-quiz"
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
          >
            Start a quiz now
          </Link>
          <Link
            href="/student"
            className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper sm:w-auto"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  // Filter out questions that have already been resolved
  const unresolved_questions = all_results.filter(
    (q: { is_resolved: boolean }) => !q.is_resolved,
  );

  if (unresolved_questions.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-green-50 via-white to-paper p-6 shadow-sm shadow-black/5 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-green-200/55 blur-3xl" />

        <div className="relative mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-white/80 p-6 text-center shadow-sm backdrop-blur md:p-10">
          <div className="rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Great Progress
          </div>

          <div className="space-y-3">
            <h2 className="font-mono text-2xl font-semibold text-ink md:text-3xl">
              All missed questions resolved
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-primary/70 md:text-base">
              Nice work. You have finished all pending AI review questions for
              now.
            </p>
          </div>

          <Link
            href="/student/play-quiz"
            className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            Attempt another quiz
          </Link>
        </div>
      </section>
    );
  }

  return <ChatAiClient questions_to_solve={unresolved_questions} />;
};

export default Chat_Ai;
