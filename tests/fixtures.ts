import type {
  AiExplanation,
  DashboardResponse,
  StudentSession,
  Subject,
  SubmitPaperResponse,
  Tutor,
} from "~/lib/api/schemas";

/**
 * Test fixtures.
 *
 * These exist ONLY for the test suite. Nothing in app/, components/ or lib/
 * imports this file - production code renders backend data or an honest empty
 * state, never a fixture.
 *
 * Shapes mirror real responses captured from the deployed backend
 * (https://eduvault-jadl.onrender.com/openapi.json).
 */

export const subjectsFixture: Subject[] = [
  {
    id: 1,
    name: "Integrated Science",
    papers: [{ id: 1, year: 2024, paper_number: "Paper 1" }],
  },
  {
    id: 6,
    name: "Physics",
    papers: [
      { id: 6, year: 2025, paper_number: "Paper 1" },
      { id: 7, year: 2020, paper_number: "Paper 1" },
      { id: 8, year: 2020, paper_number: "Paper 2" },
    ],
  },
  {
    id: 4,
    name: "Chemistry",
    papers: [{ id: 4, year: 2023, paper_number: "Paper 1" }],
  },
];

export const dashboardFixture: DashboardResponse = {
  user: { name: "Ama Serwaa Owusu" },
  overview: {
    current_streak: 3,
    average_score: 55.4,
    accuracy: 71.4,
    total_questions_solved: 84,
    // The backend does not implement duration tracking yet.
    total_duration_minutes: null,
  },
  subject_mastery: [
    { subject_name: "Physics", mastery_percentage: 78.5, strongest_topic: null },
    { subject_name: "Chemistry", mastery_percentage: 48, strongest_topic: null },
  ],
  areas_to_improve: [{ subject_name: "Chemistry", mastery_percentage: 48 }],
  unfinished_quizzes: [],
  monthly_activity: {
    year: 2026,
    month: 9,
    days: [
      { date: "2026-09-01", quiz_count: 0 },
      { date: "2026-09-02", quiz_count: 3 },
      { date: "2026-09-03", quiz_count: 12 },
    ],
  },
};

export const emptyDashboardFixture: DashboardResponse = {
  user: { name: "Kojo" },
  overview: {
    current_streak: 0,
    average_score: 0,
    accuracy: 0,
    total_questions_solved: 0,
    total_duration_minutes: 0,
  },
  subject_mastery: [],
  areas_to_improve: [],
  unfinished_quizzes: [],
  monthly_activity: { year: 2026, month: 9, days: [] },
};

export const tutorFixture: Tutor = {
  id: 3,
  full_name: "Yaa Asantewaa Mensah",
  profile_image: null,
  location: "Kumasi, Ghana",
  is_available_today: true,
  specializations: ["WASSCE Preparation", "Problem Solving"],
  rating: 4.5,
  review_count: 12,
  years_of_experience: 6,
  session_fee: 50,
  bio: "Focused on breaking difficult concepts into simple steps.",
  subjects: ["Physics", "Chemistry", "Elective ICT"],
};

export const submitResultFixture: SubmitPaperResponse = {
  attempt_id: 7,
  score: 3,
  total_questions: 5,
  percentage: 60,
  correct: 3,
  wrong: 2,
  wrong_questions: [{ question_id: 105 }, { question_id: 108 }],
};

export const explanationFixture: AiExplanation = {
  question_id: 105,
  question_text: "What is the SI unit of force?",
  student_answer: { label: "B", text: "joule" },
  correct_answer: { label: "C", text: "newton" },
  topic: "Mechanics",
  concept: "SI base and derived units",
  why_student_answer_is_wrong: "The joule measures energy, not force.",
  why_correct_answer_is_right: "One newton accelerates one kilogram at one metre per second squared.",
  solution: "Force = mass x acceleration, so the unit is kg m/s^2, named the newton.",
  key_takeaway: "Match the quantity to its derived unit before answering.",
};

export function sessionFixture(overrides: Partial<StudentSession> = {}): StudentSession {
  return {
    id: 11,
    scheduled_at: "2026-09-20T16:00:00Z",
    duration_minutes: 60,
    status: "PENDING",
    meeting_url: null,
    created_at: "2026-09-09T09:00:00Z",
    tutor: { id: 3, name: "Yaa Asantewaa Mensah" },
    subject: { id: 6, name: "Physics" },
    ...overrides,
  };
}
