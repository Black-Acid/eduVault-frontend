"use client";

import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { Subject } from "~/lib/api/schemas";
import { buildQuizHref } from "~/lib/quiz/selection";
import {
  availablePapers,
  availableYears,
  initialSelectorState,
  isSelectionComplete,
  quizSelectorReducer,
} from "~/lib/quiz/selector-state";

/**
 * Subject / year / paper selector.
 *
 * The three dropdowns are strictly dependent, and the resulting URL carries
 * stable backend ids (`?subjectId=&paperId=`) rather than a hyphenated subject
 * name that has to be reconstructed on the server.
 */
export default function Choose_Subject({
  subjects,
  initialSubjectId = null,
}: {
  subjects: Subject[];
  initialSubjectId?: number | null;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizSelectorReducer, initialSubjectId, initialSelectorState);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const years = availableYears(subjects, state);
  const papers = availablePapers(subjects, state);

  const subjectItems = subjects.map((subject) => ({
    value: String(subject.id),
    label: subject.name,
  }));
  const yearItems = years.map((year) => ({ value: String(year), label: String(year) }));
  const paperItems = papers.map((paper) => ({
    value: String(paper.id),
    label: paper.paper_number,
  }));

  const handleStartQuiz = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isSelectionComplete(subjects, state)) {
      setError("Choose a subject, a year and a paper before starting.");
      return;
    }

    setError(null);
    setIsNavigating(true);
    router.push(buildQuizHref(state.subjectId, state.paperId));
  };

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col gap-y-3 rounded-2xl border bg-sidebar p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-blue-600">No papers available</h1>
          <p className="text-primary/70">
            EduVault has no past papers to practise right now. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-y-6 rounded-2xl border bg-sidebar p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-blue-600">Choose a paper</h1>
        <p className="text-primary/70">Pick a subject, then the exam year and paper.</p>

        <form onSubmit={handleStartQuiz} className="flex flex-col gap-y-4" noValidate>
          <div className="flex flex-col gap-y-1.5 text-left">
            <label
              htmlFor="quiz-subject"
              className="block text-xs font-semibold uppercase tracking-wider text-blue-600/70"
            >
              Subject
            </label>
            <Select
              items={subjectItems}
              value={state.subjectId === null ? null : String(state.subjectId)}
              onValueChange={(value: string | null) =>
                dispatch({
                  type: "select-subject",
                  subjectId: value ? Number(value) : null,
                })
              }
            >
              <SelectTrigger id="quiz-subject" className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Subjects</SelectLabel>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {state.subjectId !== null ? (
            <div className="flex flex-col gap-y-1.5 text-left">
              <label
                htmlFor="quiz-year"
                className="block text-xs font-semibold uppercase tracking-wider text-primary/70"
              >
                Year
              </label>
              <Select
                items={yearItems}
                value={state.year === null ? null : String(state.year)}
                onValueChange={(value: string | null) =>
                  dispatch({ type: "select-year", year: value ? Number(value) : null })
                }
              >
                <SelectTrigger id="quiz-year" className="w-full">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Years</SelectLabel>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Papers are filtered by the selected year, so the trio always
              resolves to exactly one backend Paper record. */}
          {state.year !== null ? (
            <div className="flex flex-col gap-y-1.5 text-left">
              <label
                htmlFor="quiz-paper"
                className="block text-xs font-semibold uppercase tracking-wider text-primary/70"
              >
                Paper
              </label>
              <Select
                items={paperItems}
                value={state.paperId === null ? null : String(state.paperId)}
                onValueChange={(value: string | null) =>
                  dispatch({ type: "select-paper", paperId: value ? Number(value) : null })
                }
              >
                <SelectTrigger id="quiz-paper" className="w-full">
                  <SelectValue placeholder="Select a paper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Papers</SelectLabel>
                    {papers.map((paper) => (
                      <SelectItem key={paper.id} value={String(paper.id)}>
                        {paper.paper_number}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-left text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isNavigating}>
            {isNavigating ? "Loading paper…" : "Start Quiz"}
          </Button>
        </form>
      </div>
    </div>
  );
}
