export type Subjects = {
  id: string;
  name: string;
  papers: [
    {
      id: number;
      year: number;
      paper_number: string;
    },
  ];
};

type Option = {
  id: number;
  label: string;
  text: string;
};

export type Questions = {
  id: number;
  question_number: 1;
  question: string;
  options: Option[];
};

export const fetch_subject = async () => {
  const fallback: [] = [];
  try {
    const response = await fetch(
      "https://eduvault-jadl.onrender.com/subjects/",
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: Subjects[] = await response.json();
    return data ?? fallback;
  } catch (error) {
    console.error("Fetch error:", error);
    return fallback;
  }
};

export const fetch_questions = async (
  subject: string,
  year: number,
  paper_number: string,
) => {
  const fallback: [] = [];
  try {
    const response = await fetch(
      "https://eduvault-jadl.onrender.com/questions/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
          year: year,
          paper_number: paper_number,
        }),
      },
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: Questions[] = await response.json();
    return data ?? fallback;
  } catch (error) {
    console.error("Fetch error:", error);
    return fallback;
  }
};
