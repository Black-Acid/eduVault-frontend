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

interface QuizQuestionCardProps {
  question: Question;
  selected_id?: number | null;
  onSelect: (id: number) => void;
}

export default function Quiz_Question_Card({
  question,
  selected_id,
  onSelect,
}: QuizQuestionCardProps) {
  return (
    <div className="rounded-2xl shadow-xl p-6 md:p-8 flex flex-col gap-y-6 border bg-sidebar">
      <h2 className="text-xl md:text-2xl font-bold leading-snug text-indigo-600">
        {question.question_number}. {question.question}
      </h2>

      <div className="flex flex-col gap-y-3">
        {question.options.map((option) => {
          const isSelected = selected_id === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between font-medium ${
                isSelected
                  ? "border-indigo-600 bg-indigo-600/5 text-indigo-600 shadow-sm"
                  : "border-indigo-600/20 hover:border-indigo-600/40 bg-white hover:bg-primary-foreground/80 text-primary/70"
              }`}
            >
              <span>
                <strong>{option.label}.</strong> {option.text}
              </span>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-indigo-600/40 text-transparent"
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
