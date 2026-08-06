"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Quiz_Results_Card from "./quiz-result-card";
import Quiz_Question_Card from "./quiz-question-card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import Choose_Subject from "./choose-subject";

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
}

export default function Quiz_Client({ questions }: Quiz_Client_Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(60);
    } else {
      setIsSubmitted(true);
    }
  };

  useEffect(() => {
    if (isSubmitted) return;

    if (timeLeft <= 0) {
      // avoid calling setState synchronously inside effect to prevent cascading renders

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

  const handleSelectOption = (label: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: label,
    });
  };

  if (isSubmitted) {
    return (
      <Quiz_Results_Card
        totalQuestions={questions.length}
        onRestart={() => {
          setIsSubmitted(false);
          setCurrentIndex(0);
          setSelectedAnswers({});
          setTimeLeft(30);
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
            <span className="font-semibold text-primary">
              {currentIndex + 1}
            </span>{" "}
            of {questions.length}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              timeLeft < 10
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-primary-foreground text-primary/70"
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
          selectedLabel={selectedAnswers[currentQuestion.id]}
          onSelect={handleSelectOption}
        />
      </div>

      {/* Footer Navigation */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-end">
        <Button onClick={handleNext} className="font-medium">
          {currentIndex === questions.length - 1
            ? "Submit Quiz"
            : "Next Question"}
        </Button>
      </div>
    </div>
  );
}
