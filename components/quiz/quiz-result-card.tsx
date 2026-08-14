"use client";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { Results } from "./quiz-client";

interface QuizResultsCardProps {
  results: Results | null;
  onRestart: () => void;
  onDashboard: () => void;
  onAI: () => void;
}

export default function Quiz_Results_Card({
  results,
  onRestart,
  onDashboard,
  onAI,
}: QuizResultsCardProps) {
  useEffect(() => {
    if (results) {
      const wrong_answers = results?.wrong_questions;
      const wrongs = wrong_answers?.map(
        ({ question_id }: { question_id: number }) => ({
          attempt_id: results?.attempt_id,
          question_id,
          is_solved: false,
        }),
      );
      const d = new Date();
      d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
      const expires = "expires=" + d.toUTCString();

      // Store results directly as a JSON string without encoding
      document.cookie = `quiz_results=${JSON.stringify(wrongs)}; ${expires}; path=/; SameSite=Lax`;
    }
  }, [results]);
  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center flex flex-col border gap-y-6">
        <div className="w-20 h-20 bg-primary-foreground rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          🎉
        </div>
        <h1 className="text-2xl font-bold text-blue-600">Quiz Completed!</h1>
        <p className="text-primary/70">
          Great job reviewing your core subject material today.
        </p>

        <div className="grid grid-cols-2 gap-4 bg-primary-foreground p-4 rounded-xl border border-primary/20">
          <p className="text-left text-primary/70">
            <span>Total Questions: </span>
            <span className="font-semibold text-blue-600">
              {results?.total_questions || 0}
            </span>
          </p>
          <p className="text-left text-primary/70">
            <span>Correct Answers:</span>
            <span className="font-semibold text-blue-600">
              {results?.correct || 0}
            </span>
          </p>
          <p className="text-left text-primary/70">
            <span>Wrong Answers:</span>
            <span className="font-semibold text-blue-600">
              {results?.wrong || 0}
            </span>
          </p>
          <p className="text-left text-primary/70">
            <span>Score:</span>
            <span className="font-semibold text-blue-600">
              {results?.score || 0}/{results?.total_questions || 0}
            </span>
          </p>
          <p className="col-span-full text-primary/70">
            <span className="font-semibold text-blue-600 text-4xl">
              {results?.percentage?.toFixed(2) || 0}%
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-y-3">
          <Button onClick={onAI}>Review with AI</Button>
          <Button onClick={onRestart}>Try Again</Button>
          <Button onClick={onDashboard} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
