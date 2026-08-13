import { toast } from "~/components/ui/toast";

export const submit_answers = async ({
  selectedAnswers,
  paper_id,
}: {
  selectedAnswers:
    | {
        question_id: number;
        selected_option_id: number | null;
      }[]
    | null;
  paper_id: number;
}) => {
  try {
    const response = await fetch("/api/submit-quiz/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedAnswers, paper_id }),
    });
    if (!response.ok) {
      toast.add({ description: "Could not fetch answers", type: "error" });
    }
    const data = await response.json();
    return data;
  } catch {
    return toast.add({
      description:
        "An error occurred while submitting the quiz. Please try again.",
      type: "error",
    });
  }
};

export const chat_ai = async ({
  attempt_id,
  question_id,
}: {
  attempt_id: number;
  question_id: number;
}) => {
  try {
    const response = await fetch("/api/chat-ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attempt_id, question_id }),
    });
    if (!response.ok) {
      return toast.add({
        description: "Could not send message to the AI",
        type: "error",
      });
    }
    const data = await response.json();
    return data;
  } catch (error) {
    // LOG THE ACTUAL ERROR TO YOUR TERMINAL INSTEAD OF HIDING IT
    console.error("API Route Internal Error:", error);
    return toast.add({
      description:
        "An error occurred while submitting question to the AI. Please try again.",
      type: "error",
    });
  }
};
