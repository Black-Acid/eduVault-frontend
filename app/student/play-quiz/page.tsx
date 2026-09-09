import Choose_Subject from "~/components/quiz/choose-subject";
import Quiz_Client from "~/components/quiz/quiz-client";
import { ErrorState } from "~/components/general/states";
import { toUserMessage } from "~/lib/api/errors";
import { getQuestions } from "~/lib/api/quizzes";
import type { Question, Subject } from "~/lib/api/schemas";
import { getSubjects } from "~/lib/api/subjects";
import { parseId, resolvePaperSelection } from "~/lib/quiz/selection";

export const metadata = {
  title: "Practise a paper | EduVault",
};

type PageProps = {
  searchParams: Promise<{ subjectId?: string; paperId?: string }>;
};

export default async function QuizPlayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const subjectId = parseId(params.subjectId);
  const paperId = parseId(params.paperId);

  let subjects: Subject[];

  try {
    subjects = await getSubjects();
  } catch (error) {
    return (
      <section className="p-2">
        <ErrorState title="We could not load the subject list" message={toUserMessage(error)} />
      </section>
    );
  }

  // Without a complete, valid pair of ids we show the selector rather than
  // guessing at a paper.
  const selection = resolvePaperSelection(subjects, subjectId, paperId);

  if (!selection) {
    return (
      <section className="p-2">
        {paperId !== null ? (
          <div className="mx-auto mb-4 max-w-md">
            <ErrorState
              title="That paper is not available"
              message="The paper you asked for does not belong to that subject. Choose a paper below."
            />
          </div>
        ) : null}
        <Choose_Subject subjects={subjects} initialSubjectId={subjectId} />
      </section>
    );
  }

  const { subject, paper } = selection;

  let questions: Question[];

  try {
    // Subject name, year and paper number all come from the one Paper record
    // that `paperId` resolved to - never from raw query-string text.
    questions = await getQuestions({
      subject: subject.name,
      year: paper.year,
      paperNumber: paper.paper_number,
    });
  } catch (error) {
    return (
      <section className="p-2">
        <ErrorState title="We could not load this paper" message={toUserMessage(error)} />
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="flex flex-col gap-4 p-2">
        <div className="mx-auto max-w-md">
          <ErrorState
            title="This paper has no questions yet"
            message={`EduVault has no questions for ${subject.name} ${paper.year} ${paper.paper_number}. Try another paper.`}
          />
        </div>
        <Choose_Subject subjects={subjects} initialSubjectId={subject.id} />
      </section>
    );
  }

  return (
    <Quiz_Client
      questions={questions}
      paperId={paper.id}
      subjectName={subject.name}
      year={paper.year}
      paperNumber={paper.paper_number}
    />
  );
}
