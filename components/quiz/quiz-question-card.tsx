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
  selectedLabel?: string;
  onSelect: (label: string) => void;
}

export default function Quiz_Question_Card({
  question,
  selectedLabel,
  onSelect,
}: QuizQuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border">
      <h2 className="text-xl md:text-2xl font-bold leading-snug">
        {question.question_number}. {question.question}
      </h2>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedLabel === option.label;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.label)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between font-medium ${
                isSelected
                  ? "border-primary bg-primary-foreground text-primary shadow-sm"
                  : "border-primary/20 hover:border-primary/70 hover:bg-primary-foreground/80 text-primary/70"
              }`}
            >
              <span>
                <strong>{option.label}.</strong> {option.text}
              </span>
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-transparent"
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
