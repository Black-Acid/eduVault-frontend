import Choose_Subject from "~/components/quiz/choose-subject";
import Quiz_Client from "~/components/quiz/quiz-client";
import { fetch_questions, fetch_subject } from "~/lib/data";

interface PageProps {
  searchParams: Promise<{
    subject?: string;
    year?: string;
    paper?: string;
  }>;
}

export default async function Quiz_Play_Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const subjectName = params.subject;
  const subjectYear = params.year;
  const subjectPaper = params.paper;

  // 1. Fetch available subjects for the dropdown/selection UI
  const subjects = await fetch_subject();

  // 2. If any selection parameter is missing, show the selection screen
  if (!subjectName || !subjectYear || !subjectPaper) {
    return <Choose_Subject subjects={subjects} />;
  }

  console.log(
    subjectName.split("-").join(" "),
    subjectPaper.split("-").join(" "),
    parseInt(subjectYear),
  );

  // 3. Otherwise, fetch the questions using the parameters from the URL
  const questions = await fetch_questions(
    subjectName.split("-").join(" "),
    parseInt(subjectYear),
    subjectPaper.split("-").join(" "),
  );

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 mb-4">
          No questions found for this selection.
        </p>
        <Choose_Subject subjects={subjects} />
      </div>
    );
  }

  // 4. Render the active quiz client component with the fetched questions
  return <Quiz_Client questions={questions} />;
}
