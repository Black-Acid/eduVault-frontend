"use client";
import { Subjects } from "~/lib/data";
import { Button } from "../ui/button";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "../ui/toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function Choose_Subject({ subjects }: { subjects: Subjects[] }) {
  const router = useRouter();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPaper, setSelectedPaper] = useState("");

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject || !selectedYear || !selectedPaper) {
      toast.add({
        description:
          "Please select a subject, year, and paper before starting the quiz.",
        type: "destructive",
      });
      return;
    }
    const subject = selectedSubject.split(" ").join("-");
    const paper = selectedPaper.split(" ").join("-");

    // Push parameters to the server component page URL
    router.push(
      `/student/play-quiz?subject=${subject}&year=${selectedYear}&paper=${paper}`,
    );
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-sidebar rounded-2xl shadow-xl max-w-md w-full p-8 text-center flex flex-col border gap-y-6">
        <h1 className="text-2xl font-bold text-indigo-600">Choose a Subject</h1>
        <p className="text-primary/70">Select a subject to start the quiz.</p>

        <form onSubmit={handleStartQuiz} className="flex flex-col gap-y-4">
          {/* Subject Selection */}
          <div className="flex flex-col gap-y-1.5">
            <label className="block text-xs font-semibold text-indigo-600/70 uppercase tracking-wider">
              Subject
            </label>
            <Select
              items={subjects.map(({ name }) => ({ value: name, label: name }))}
              onValueChange={(value: string | null) =>
                setSelectedSubject(value ?? "")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Subjects</SelectLabel>
                  {subjects.map(({ name }) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}

          {selectedSubject && (
            <div className="flex flex-col gap-y-1.5">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-wider">
                Year
              </label>
              <Select
                onValueChange={(value: string | null) =>
                  setSelectedYear(value ?? "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Years</SelectLabel>
                    {subjects
                      .find(({ name }) => name === selectedSubject)
                      ?.papers.map(({ year }) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedSubject && (
            <div className="flex flex-col gap-y-1.5">
              <label className="block text-xs font-semibold text-primary/70 uppercase tracking-wider">
                Paper Number
              </label>
              <Select
                onValueChange={(value: string | null) =>
                  setSelectedPaper(value ?? "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a paper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Papers</SelectLabel>
                    {subjects
                      .find(({ name }) => name === selectedSubject)
                      ?.papers.map(({ paper_number }) => (
                        <SelectItem key={paper_number} value={paper_number}>
                          {paper_number}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit Action */}
          <Button type="submit">Start Quiz</Button>
        </form>
      </div>
    </div>
  );
}
