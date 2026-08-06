import { Button } from "../ui/button";

interface QuizResultsCardProps {
  totalQuestions: number;
  onRestart: () => void;
  onDashboard: () => void;
}

export default function Quiz_Results_Card({
  totalQuestions,
  onRestart,
  onDashboard,
}: QuizResultsCardProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center flex flex-col border gap-y-6">
        <div className="w-20 h-20 bg-primary-foreground rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          🎉
        </div>
        <h1 className="text-2xl font-bold">Quiz Completed!</h1>
        <p className="text-primary/70">
          Great job reviewing your core subject material today.
        </p>

        <div className="bg-primary-foreground p-4 rounded-xl border border-primary/20">
          <p className="text-sm text-primary/70">Total Questions Answered</p>
          <p className="text-4xl font-bold mt-1">{totalQuestions}</p>
        </div>

        <div className="flex flex-col gap-y-3">
          <Button onClick={onRestart}>Try Again</Button>
          <Button onClick={onDashboard} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
