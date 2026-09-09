"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Quiz_Question_Card from "./quiz-question-card";
import Quiz_Results_Card from "./quiz-result-card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { submitPaperResponseSchema, type Question, type SubmitPaperResponse } from "~/lib/api/schemas";

/** Seconds allowed per question. UI configuration, not backend data. */
export const SECONDS_PER_QUESTION = 60;

type QuizStatus = "answering" | "submitting" | "submitted" | "error";

export type Quiz_Client_Props = {
  questions: Question[];
  /** The id of the exact backend Paper these questions came from. */
  paperId: number;
  subjectName: string;
  year: number;
  paperNumber: string;
};

export default function Quiz_Client({
  questions,
  paperId,
  subjectName,
  year,
  paperNumber,
}: Quiz_Client_Props) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [status, setStatus] = useState<QuizStatus>("answering");
  const [results, setResults] = useState<SubmitPaperResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Guards against a double submit from a fast double-click or the timer
  // firing while a request is already in flight.
  const submissionLock = useRef(false);

  // The countdown reads the latest answers through this ref so that selecting
  // an option does not restart the interval. It is written only from event
  // handlers, never during render.
  const answersRef = useRef<Record<number, number>>({});

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  const submitQuiz = useCallback(
    async (finalAnswers: Record<number, number>) => {
      if (submissionLock.current) return;
      submissionLock.current = true;

      setStatus("submitting");
      setErrorMessage(null);

      // Only questions that actually have an answer are sent. The backend
      // requires an int `selected_option_id`, so an unanswered question is
      // omitted - never sent as null or with an invented option id.
      const payload = Object.entries(finalAnswers).map(([questionId, optionId]) => ({
        question_id: Number(questionId),
        selected_option_id: optionId,
      }));

      try {
        const response = await fetch("/api/submit-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paper_id: paperId, answers: payload }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setErrorMessage(
            (data as { error?: string } | null)?.error ??
              "We could not submit your quiz. Please try again.",
          );
          setStatus("error");
          return;
        }

        const parsed = submitPaperResponseSchema.safeParse(data);

        if (!parsed.success) {
          setErrorMessage("EduVault returned an unexpected result, so we could not score this quiz.");
          setStatus("error");
          return;
        }

        setResults(parsed.data);
        setStatus("submitted");
      } catch {
        setErrorMessage("We could not reach EduVault. Check your connection and try again.");
        setStatus("error");
      } finally {
        submissionLock.current = false;
      }
    },
    [paperId],
  );

  const goToNext = useCallback(
    (finalAnswers: Record<number, number>) => {
      if (isLastQuestion) {
        void submitQuiz(finalAnswers);
        return;
      }

      setNotice(null);
      setCurrentIndex((index) => index + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
    },
    [isLastQuestion, submitQuiz],
  );

  // Countdown. When it reaches zero the question is left unanswered and we
  // move on - the answer is never guessed on the student's behalf.
  useEffect(() => {
    if (status !== "answering") return;

    if (timeLeft <= 0) {
      goToNext(answersRef.current);
      return;
    }

    const timer = setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status, goToNext]);

  const handleSelectOption = (optionId: number) => {
    if (status !== "answering") return;

    setNotice(null);
    const next = { ...answersRef.current, [currentQuestion.id]: optionId };
    answersRef.current = next;
    setAnswers(next);
  };

  const handleNext = () => {
    if (status !== "answering") return;

    if (answers[currentQuestion.id] === undefined) {
      setNotice("Select an answer before continuing, or wait for the timer to move you on.");
      return;
    }

    goToNext(answers);
  };

  const handleRetrySubmit = () => {
    setStatus("answering");
    void submitQuiz(answers);
  };

  const handleRestart = () => {
    setResults(null);
    answersRef.current = {};
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(SECONDS_PER_QUESTION);
    setErrorMessage(null);
    setNotice(null);
    setStatus("answering");
  };

  if (status === "error") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col gap-y-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-red-700">We could not submit your quiz</h1>
          <p role="alert" className="text-primary/80">
            {errorMessage}
          </p>
          <p className="text-sm text-primary/60">
            Your answers are still here. Submitting again will not lose them.
          </p>
          <div className="flex flex-col gap-y-3">
            <Button onClick={handleRetrySubmit}>Try submitting again</Button>
            <Button variant="outline" onClick={() => router.push("/student")}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "submitted" && results) {
    return (
      <Quiz_Results_Card
        results={results}
        unansweredCount={unansweredCount}
        onAI={() => router.push("/student/chat-ai")}
        onRestart={handleRestart}
        onDashboard={() => router.push("/student")}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4">
        <p className="text-sm text-primary/60">
          {subjectName} · {year} · {paperNumber}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
          <span className="text-primary/70">
            Question <span className="font-semibold text-blue-600">{currentIndex + 1}</span> of{" "}
            {questions.length}
          </span>
          <span
            aria-live="polite"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              timeLeft < 10
                ? "animate-pulse bg-red-100 text-red-600"
                : "bg-primary-foreground text-blue-600/70"
            }`}
          >
            {timeLeft}s remaining
          </span>
        </div>

        <Progress value={progressPercentage} />
      </div>

      <div className="mx-auto my-8 w-full max-w-2xl">
        <Quiz_Question_Card
          question={currentQuestion}
          selected_id={answers[currentQuestion.id] ?? null}
          onSelect={handleSelectOption}
        />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col items-end gap-3">
        {notice ? (
          <p role="alert" className="w-full text-left text-sm text-amber-700">
            {notice}
          </p>
        ) : null}

        {/* Unanswered questions are counted as wrong by the backend and cannot
            be reviewed with AI, so we say so before the student submits. */}
        {isLastQuestion && unansweredCount > 0 ? (
          <p className="w-full text-left text-sm text-primary/70">
            {unansweredCount} of {questions.length} questions have no answer. They will be marked
            wrong and cannot be reviewed with AI.
          </p>
        ) : null}

        <Button onClick={handleNext} disabled={status === "submitting"} className="font-medium">
          {isLastQuestion
            ? status === "submitting"
              ? "Submitting…"
              : "Submit Quiz"
            : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
