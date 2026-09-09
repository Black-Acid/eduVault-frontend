"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Button } from "../ui/button";
import { Message, MessageAvatar, MessageContent } from "../ui/message";
import { aiExplanationSchema, type AiExplanation } from "~/lib/api/schemas";
import type { ReviewQueueItem } from "~/lib/quiz/review-queue";

type ChatAiClientProps = {
  /** Questions still awaiting review, in queue order. */
  pending: ReviewQueueItem[];
  /** Total wrong answers in this attempt. */
  totalCount: number;
  /** How many of them have already been reviewed. */
  resolvedCount: number;
};

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; explanation: AiExplanation }
  | { status: "error"; message: string };

/**
 * Renders the backend's structured explanation for one missed question.
 *
 * There is no free-form chat here: `POST /ai/explain` returns a fixed set of
 * fields and nothing else, so no follow-up conversation is simulated.
 */
const ChatAiClient = ({ pending, totalCount, resolvedCount }: ChatAiClientProps) => {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentQuestion = pending[0];

  /**
   * Fetches the explanation. State is only written after the request settles;
   * the initial "loading" state comes from `useState`, and the component is
   * keyed by question id so each question starts from it.
   */
  const loadExplanation = useCallback(async (item: ReviewQueueItem, signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/chat-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: item.attempt_id,
          question_id: item.question_id,
        }),
        signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setState({
          status: "error",
          message:
            (data as { error?: string } | null)?.error ??
            "We could not load the AI explanation for this question.",
        });
        return;
      }

      const parsed = aiExplanationSchema.safeParse(data);

      if (!parsed.success) {
        setState({
          status: "error",
          message: "EduVault returned an explanation in an unexpected format.",
        });
        return;
      }

      setState({ status: "loaded", explanation: parsed.data });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({
        status: "error",
        message: "We could not reach EduVault. Check your connection and try again.",
      });
    }
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;

    const controller = new AbortController();
    // `loadExplanation` only writes state after the request settles, but the
    // compiler lint cannot see across the async boundary. Fetching on mount is
    // the intended behaviour here: the queue entry is known only once the
    // server has rendered it, and the request needs an abortable lifetime.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExplanation(currentQuestion, controller.signal);

    return () => controller.abort();
  }, [currentQuestion, loadExplanation]);

  const handleNextQuestion = async () => {
    if (!currentQuestion || isAdvancing) return;

    setIsAdvancing(true);

    try {
      const response = await fetch("/api/resolve-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: currentQuestion.attempt_id,
          question_id: currentQuestion.question_id,
        }),
      });

      if (response.ok) {
        // The queue lives in an HTTP-only cookie, so the server re-renders the
        // next question (or the all-resolved state).
        router.refresh();
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!currentQuestion) return null;

  // Real queue position, from the queue the backend's wrong_questions produced.
  const position = resolvedCount + 1;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
      <h1 className="font-medium text-blue-600">Reviewing missed questions</h1>
      <p className="text-xs font-medium text-primary/80">
        Question {position} of {totalCount}
      </p>
    </div>
  );

  if (state.status === "loading") {
    return (
      <div className="relative mx-auto -mt-6 flex min-h-dvh w-full max-w-360 flex-col">
        <section className="rounded-lg border bg-primary-foreground/90 p-4 shadow">
          {header}
          <div
            role="status"
            aria-busy="true"
            className="mt-6 flex items-center justify-center rounded-lg border p-20"
          >
            <p className="animate-pulse text-xl font-medium text-blue-600/70">
              Fetching AI explanation…
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="relative mx-auto -mt-6 flex min-h-dvh w-full max-w-360 flex-col">
        <section className="rounded-lg border bg-primary-foreground/90 p-4 shadow">
          {header}
          <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50/60 p-10 text-center">
            <p role="alert" className="text-lg font-medium text-red-700">
              {state.message}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => {
                  setState({ status: "loading" });
                  void loadExplanation(currentQuestion);
                }}
              >
                Try again
              </Button>
              <Button variant="outline" onClick={handleNextQuestion} disabled={isAdvancing}>
                Skip this question
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { explanation } = state;

  return (
    <div className="relative mx-auto -mt-6 flex min-h-dvh w-full max-w-360 flex-col">
      <div aria-hidden="true" className="sticky top-0 z-20 h-2 w-full bg-white" />
      <section className="sticky top-2 z-10 rounded-lg border bg-primary-foreground/90 p-4 shadow backdrop-blur">
        {header}
        <div className="mt-2 flex flex-col gap-y-2">
          <p className="font-semibold uppercase text-blue-600/70">Question</p>
          <p className="-mt-1 text-base break-words text-primary/90">{explanation.question_text}</p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-y-1 rounded-lg border border-red/50 bg-red/10 p-2 text-sm sm:max-w-md">
              <p className="flex gap-x-2 font-semibold uppercase text-red">
                <span aria-hidden="true">✕</span>
                <span>your answer</span>
              </p>
              <p className="text-base break-words text-primary/90">
                {explanation.student_answer.label}. {explanation.student_answer.text}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-y-1 rounded-lg border border-green/50 bg-green/10 p-2 text-sm sm:max-w-md">
              <p className="flex gap-x-2 font-semibold uppercase text-green">
                <span aria-hidden="true">✓</span>
                <span>correct answer</span>
              </p>
              <p className="text-base break-words text-primary/90">
                {explanation.correct_answer.label}. {explanation.correct_answer.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="z-0 mt-6 flex min-h-[calc(100vh-200px)] flex-col gap-y-8 px-4">
        <Message>
          <MessageAvatar className="self-start">
            <Avatar>
              <AvatarFallback className="bg-blue-600 font-semibold text-white">AI</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="ghost">
              <BubbleContent className="flex flex-col gap-y-4 text-base">
                <div className="flex flex-col gap-y-1">
                  <p className="flex flex-wrap gap-x-2 text-sm font-semibold uppercase text-blue-600">
                    Topic: <span className="break-words">{explanation.topic}</span>
                  </p>
                  <p className="flex flex-wrap gap-x-2 text-sm font-semibold uppercase text-blue-600">
                    Concept: <span className="break-words">{explanation.concept}</span>
                  </p>
                </div>

                {(
                  [
                    ["Solution", explanation.solution],
                    ["Why your answer is wrong", explanation.why_student_answer_is_wrong],
                    ["Why the correct answer is right", explanation.why_correct_answer_is_right],
                    ["Key takeaway", explanation.key_takeaway],
                  ] as const
                ).map(([heading, body]) => (
                  <div key={heading} className="flex flex-col gap-y-1">
                    <h2 className="text-sm font-semibold uppercase text-blue-600">{heading}</h2>
                    <p className="whitespace-pre-line break-words text-base text-primary/90">
                      {body}
                    </p>
                  </div>
                ))}
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>

        <div className="flex justify-end border-t pt-8">
          <Button onClick={handleNextQuestion} disabled={isAdvancing}>
            {isAdvancing
              ? "Saving…"
              : pending.length === 1
                ? "Finish review"
                : "Next question"}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ChatAiClient;
