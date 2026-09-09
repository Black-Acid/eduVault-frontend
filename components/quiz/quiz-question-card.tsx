import type { Question } from "~/lib/api/schemas";

type QuizQuestionCardProps = {
  question: Question;
  selected_id?: number | null;
  onSelect: (id: number) => void;
};

export default function Quiz_Question_Card({
  question,
  selected_id,
  onSelect,
}: QuizQuestionCardProps) {
  const groupLabelId = `question-${question.id}-label`;

  return (
    <div className="flex flex-col gap-y-6 rounded-2xl border bg-sidebar p-6 shadow-xl md:p-8">
      <h2
        id={groupLabelId}
        className="text-xl font-bold leading-snug break-words text-blue-600 md:text-2xl"
      >
        {question.question_number}. {question.question}
      </h2>

      <div className="flex flex-col gap-y-3" role="radiogroup" aria-labelledby={groupLabelId}>
        {question.options.map((option) => {
          const isSelected = selected_id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 p-4 text-left font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isSelected
                  ? "border-blue-600 bg-primary-foreground text-blue-600 shadow-sm"
                  : "border-blue-600/20 bg-white text-primary/70 hover:border-blue-600/40 hover:bg-primary-foreground/80"
              }`}
            >
              <span className="min-w-0 break-words">
                <strong>{option.label}.</strong> {option.text}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-blue-600/40 text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
