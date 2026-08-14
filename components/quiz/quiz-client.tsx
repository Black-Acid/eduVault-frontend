"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Quiz_Results_Card from "./quiz-result-card";
import Quiz_Question_Card from "./quiz-question-card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { submit_answers } from "~/lib/requests";
import { toast } from "../ui/toast";

type wrong_question = {
  question_id: number;
  selected_option_id: number;
  correct_option_id: number;
};

export type Results = {
  attempt_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct: number;
  wrong: number;
  wrong_questions: wrong_question[];
};

interface Option {
  id: number;
  label: string;
  text: string;
}

interface Question {
  id: number;
  question_number: number;
  question: string;
  options: Option[];
}

export interface Quiz_Client_Props {
  questions: Question[];
  paper_id?: number;
}

export default function Quiz_Client({
  questions,
  paper_id,
}: Quiz_Client_Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    | {
        question_id: number;
        selected_option_id: number | null;
      }[]
    | null
  >(null);

  const [results, setResults] = useState<Results | null>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = async () => {
    if (selectedAnswers?.find((a) => a.question_id === currentQuestion.id)) {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(60);
      } else {
        setIsSubmitting(true);
        setTimeLeft(0);
        const answers = await submit_answers({
          selectedAnswers,
          paper_id: paper_id as number,
        });
        setIsSubmitted(true);
        setResults(await answers);
        setIsSubmitting(false);
      }
    } else if (timeLeft <= 0) {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(60);
      } else {
        setIsSubmitting(true);
        setTimeLeft(0);
        const answers = await submit_answers({
          selectedAnswers,
          paper_id: paper_id as number,
        });
        setIsSubmitted(true);
        setResults(await answers);
        setIsSubmitting(false);
      }
    } else {
      toast.add({
        description: "Select an answer before continuing",
        type: "warning",
      });
    }
  };

  useEffect(() => {
    if (isSubmitted) return;

    if (timeLeft <= 0) {
      const t = setTimeout(() => {
        handleNext();
      }, 0);
      return () => clearTimeout(t);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentIndex, isSubmitted]);

  const handleSelectOption = (option_id: number) => {
    const selectedOptionId = currentQuestion.options.find(
      ({ id }) => id === option_id,
    )?.id as number;

    setSelectedAnswers((prev) => {
      const currentAnswers = prev || [];
      // Remove any existing answer for this question, then append the new selection
      const filteredAnswers = currentAnswers.filter(
        (ans) => ans.question_id !== currentQuestion.id,
      );

      return [
        ...filteredAnswers,
        {
          question_id: currentQuestion.id,
          selected_option_id: selectedOptionId,
        },
      ];
    });
  };

  if (isSubmitted) {
    return (
      <Quiz_Results_Card
        results={results}
        onAI={() => router.push("/student/chat-ai")}
        onRestart={() => {
          setIsSubmitted(false);
          setCurrentIndex(0);
          setSelectedAnswers(null);
          setTimeLeft(60);
        }}
        onDashboard={() => router.push("/student")}
      />
    );
  }

  return (
    <div className="flex flex-col justify-between p-4">
      {/* Top Header & Progress */}
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-y-4">
        <div className="flex items-center justify-between font-medium">
          <span className="text-primary/70">
            Question{" "}
            <span className="font-semibold text-blue-600">
              {currentIndex + 1}
            </span>{" "}
            of {questions.length}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              timeLeft < 10
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-primary-foreground text-blue-600/70"
            }`}
          >
            ⏱️ {timeLeft}s remaining
          </span>
        </div>

        <Progress value={progressPercentage} />
      </div>

      {/* Main Question Display */}
      <div className="max-w-2xl w-full mx-auto my-8">
        <Quiz_Question_Card
          question={currentQuestion}
          selected_id={
            selectedAnswers?.find((a) => a.question_id === currentQuestion.id)
              ?.selected_option_id
          }
          onSelect={handleSelectOption}
        />
      </div>

      {/* Footer Navigation */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-end">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="font-medium"
        >
          {currentIndex === questions.length - 1
            ? isSubmitting
              ? "Submitting..."
              : "Submit Quiz"
            : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
