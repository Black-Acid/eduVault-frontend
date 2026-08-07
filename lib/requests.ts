import { toast } from "~/components/ui/toast";

export const submit_answers = async ({
  selectedAnswers,
  paper_id,
}: {
  selectedAnswers:
    | {
        question_id: number;
        selected_option_id: number;
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
