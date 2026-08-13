"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { chat_ai } from "~/lib/requests";

type WrongQuestion = {
  question_id: number;
  attempt_id: number;
  is_solved: boolean;
};

type QuizResults = WrongQuestion[];

export default function ChatAiClient({
  initialResults,
}: {
  initialResults: QuizResults;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultsData, setResultsData] = useState<QuizResults | null>(
    initialResults,
  );

  const wrongQuestions = resultsData || [];
  const currentWrong = wrongQuestions[currentIndex];

  // Fetch AI explanation for the current question
  useEffect(() => {
    async function fetchAiExplanation() {
      if (!currentWrong || resultsData === undefined) return;

      setLoading(true);
      const res = await chat_ai({
        attempt_id: currentWrong.attempt_id,
        question_id: currentWrong.question_id,
      });
      setAiResponse(res);
      setLoading(false);
    }

    if (wrongQuestions.length > 0 && !isCompleted) {
      fetchAiExplanation();
    }
  }, [
    currentIndex,
    resultsData,
    currentWrong,
    isCompleted,
    wrongQuestions.length,
  ]);

  const handleNextQuestion = () => {
    if (!resultsData) return;

    // 1. Mark the current question as solved in local state copy
    const updatedWrongQuestions = [...resultsData];
    if (updatedWrongQuestions[currentIndex]) {
      updatedWrongQuestions[currentIndex].is_solved = true;
    }

    setResultsData(updatedWrongQuestions);

    // 2. Update the cookie with the new solved status (expires in 2 hours)
    const d = new Date();
    d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
    document.cookie = `quiz_results=${JSON.stringify(updatedWrongQuestions)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;

    // 3. Move to next or complete
    if (currentIndex < wrongQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Clear cookie when all wrong answers are completed
      document.cookie =
        "quiz_results=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setIsCompleted(true);
    }
  };

  if (!resultsData || wrongQuestions.length === 0 || isCompleted) {
    return (
      <section className="flex flex-col gap-y-4 border rounded-lg items-center justify-center p-20 min-h-[50vh] text-center">
        <p className="text-indigo-600 text-xl font-semibold">
          It was nice reviewing your wrong answers together.
        </p>
        <p className="text-primary/70 text-sm">
          All flagged questions have been cleared.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col max-w-2xl mx-auto border rounded-xl p-8 gap-y-6 bg-white shadow-sm my-10">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-indigo-600">AI Review Session</h2>
        <span className="text-sm font-medium text-primary/60">
          Question {currentIndex + 1} of {wrongQuestions.length}
        </span>
      </div>

      {/* Demo Question Container */}
      <div className="bg-primary-foreground p-5 rounded-lg border border-primary/10 flex flex-col gap-y-2">
        <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
          Demo Question ID: {currentWrong.question_id}
        </span>
        <p className="text-lg font-medium text-primary">
          [Demo Question]: Why is this concept structured this way based on your
          previous exam choices?
        </p>
      </div>

      {/* AI Explanation Result */}
      <div className="bg-indigo-600/5 p-5 rounded-lg border border-indigo-600/20 flex flex-col gap-y-2 min-h-30">
        <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
          AI Explanation
        </span>
        {loading ? (
          <p className="text-primary/60 italic animate-pulse">
            Analyzing question details...
          </p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {aiResponse?.explanation ||
              "Here is the breakdown of why the selected option differed from the core requirements of this paper."}
          </ReactMarkdown>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleNextQuestion}
          disabled={loading}
          className="font-medium"
        >
          {currentIndex === wrongQuestions.length - 1
            ? "Finish Review"
            : "Next Question"}
        </Button>
      </div>
    </section>
  );
}
