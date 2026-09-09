import { z } from "zod";

/**
 * Runtime contracts for every EduVault backend response the frontend consumes.
 *
 * These mirror the deployed OpenAPI document (https://eduvault-jadl.onrender.com/openapi.json).
 * Where the backend serialisation is loose - `session_fee` is a stringified
 * Decimal, `Paper.year`/`paper_number` have inconsistent model annotations -
 * the schema normalises to a single canonical frontend representation instead
 * of letting the ambiguity leak into components.
 */

/** Accepts an int or a numeric string and yields a number. */
const numericLike = z.union([z.number(), z.string()]).transform((value, ctx) => {
  const parsed = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isFinite(parsed)) {
    ctx.addIssue({ code: "custom", message: "Expected a numeric value" });
    return z.NEVER;
  }
  return parsed;
});

/** Accepts an int or a string and yields a trimmed string. */
const stringLike = z.union([z.number(), z.string()]).transform((value) => String(value).trim());

/* ------------------------------------------------------------------ auth */

/**
 * The backend educator role value is `teacher`. `tutor` is only ever a
 * display label - see lib/auth/roles.ts.
 */
export const userRoleSchema = z.enum(["student", "teacher"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const authResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  message: z.string(),
  access_token: z.string().min(1),
  token_type: z.string().default("bearer"),
  expires_at: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

/* -------------------------------------------------------------- subjects */

export const paperSchema = z.object({
  id: z.number().int(),
  year: numericLike,
  paper_number: stringLike,
});
export type Paper = z.infer<typeof paperSchema>;

export const subjectSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  papers: z.array(paperSchema).default([]),
});
export type Subject = z.infer<typeof subjectSchema>;

export const subjectListSchema = z.array(subjectSchema);

/* ------------------------------------------------------------- questions */

export const optionSchema = z.object({
  id: z.number().int(),
  label: z.string(),
  text: z.string(),
});
export type QuestionOption = z.infer<typeof optionSchema>;

export const questionSchema = z.object({
  id: z.number().int(),
  question_number: z.number().int(),
  question: z.string(),
  options: z.array(optionSchema).default([]),
});
export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);

/* ---------------------------------------------------------- quiz results */

export const wrongQuestionSchema = z.object({
  question_id: z.number().int(),
});
export type WrongQuestion = z.infer<typeof wrongQuestionSchema>;

export const submitPaperResponseSchema = z.object({
  attempt_id: z.number().int(),
  score: z.number(),
  total_questions: z.number().int(),
  percentage: z.number(),
  correct: z.number().int(),
  wrong: z.number().int(),
  wrong_questions: z.array(wrongQuestionSchema).default([]),
});
export type SubmitPaperResponse = z.infer<typeof submitPaperResponseSchema>;

/* -------------------------------------------------------- AI explanation */

export const answerInfoSchema = z.object({
  label: z.string(),
  text: z.string(),
});

export const aiExplanationSchema = z.object({
  question_id: z.number().int(),
  question_text: z.string(),
  student_answer: answerInfoSchema,
  correct_answer: answerInfoSchema,
  topic: z.string(),
  concept: z.string(),
  why_student_answer_is_wrong: z.string(),
  why_correct_answer_is_right: z.string(),
  solution: z.string(),
  key_takeaway: z.string(),
});
export type AiExplanation = z.infer<typeof aiExplanationSchema>;

/* ------------------------------------------------------------- dashboard */

export const strongestTopicSchema = z.object({
  topic_name: z.string(),
  mastery_percentage: z.number(),
});
export type StrongestTopic = z.infer<typeof strongestTopicSchema>;

export const subjectMasterySchema = z.object({
  subject_name: z.string(),
  mastery_percentage: z.number(),
  // Topic-level mastery is not implemented on the backend yet: it always
  // returns null. Nullish (not just nullable) so a future omission is tolerated.
  strongest_topic: strongestTopicSchema.nullish().transform((value) => value ?? null),
});
export type SubjectMastery = z.infer<typeof subjectMasterySchema>;

export const subjectImprovementSchema = z.object({
  subject_name: z.string(),
  mastery_percentage: z.number(),
});
export type SubjectImprovement = z.infer<typeof subjectImprovementSchema>;

export const unfinishedQuizSchema = z.object({
  quiz_id: z.number().int(),
  title: z.string(),
  total_questions: z.number().int(),
  answered_questions: z.number().int(),
  remaining_questions: z.number().int(),
  progress_percentage: z.number(),
  duration_spent_minutes: z.number().int(),
  last_activity_at: z.string(),
});
export type UnfinishedQuiz = z.infer<typeof unfinishedQuizSchema>;

export const activityDaySchema = z.object({
  date: z.string(),
  quiz_count: z.number().int(),
});
export type ActivityDay = z.infer<typeof activityDaySchema>;

export const monthlyActivitySchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  days: z.array(activityDaySchema).default([]),
});
export type MonthlyActivity = z.infer<typeof monthlyActivitySchema>;

export const dashboardOverviewSchema = z.object({
  current_streak: z.number().int(),
  average_score: z.number(),
  accuracy: z.number(),
  total_questions_solved: z.number().int(),
  // null means "not tracked yet" - it is NOT the same as 0. The UI must
  // render an unavailable state rather than a zero value.
  total_duration_minutes: z
    .number()
    .nullish()
    .transform((value) => value ?? null),
});
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

export const dashboardResponseSchema = z.object({
  user: z.object({ name: z.string() }),
  overview: dashboardOverviewSchema,
  subject_mastery: z.array(subjectMasterySchema).default([]),
  areas_to_improve: z.array(subjectImprovementSchema).default([]),
  unfinished_quizzes: z.array(unfinishedQuizSchema).default([]),
  monthly_activity: monthlyActivitySchema,
});
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/* ---------------------------------------------------------------- tutors */

export const tutorSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  profile_image: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  location: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  is_available_today: z.boolean(),
  specializations: z.array(z.string()).default([]),
  rating: z.number(),
  review_count: z.number().int(),
  years_of_experience: z.number().int(),
  // Serialised as a Decimal string ("50.0") by the deployed backend.
  session_fee: numericLike,
  bio: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  subjects: z.array(z.string()).default([]),
});
export type Tutor = z.infer<typeof tutorSchema>;

export const tutorListSchema = z.array(tutorSchema);

/* -------------------------------------------------------------- sessions */

export const SESSION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "LIVE",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

/**
 * Status is intentionally parsed as a plain string. A status the backend adds
 * later must degrade gracefully in the UI rather than fail the whole response.
 */
export const sessionStatusSchema = z.string().transform((value) => value.trim().toUpperCase());

export const studentSessionSchema = z.object({
  id: z.number().int(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int(),
  status: sessionStatusSchema,
  meeting_url: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  created_at: z.string(),
  tutor: z.object({ id: z.number().int(), name: z.string() }),
  subject: z.object({ id: z.number().int(), name: z.string() }),
});
export type StudentSession = z.infer<typeof studentSessionSchema>;

export const studentSessionListSchema = z.array(studentSessionSchema);

export const bookingResponseSchema = z.object({
  id: z.number().int(),
  student_id: z.number().int(),
  tutor_id: z.number().int(),
  subject_id: z.number().int(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int(),
  status: sessionStatusSchema,
  meeting_url: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  created_at: z.string(),
});
export type BookingResponse = z.infer<typeof bookingResponseSchema>;

export const joinSessionResponseSchema = z.object({
  session_id: z.number().int(),
  meeting_url: z.string(),
  status: sessionStatusSchema,
});
export type JoinSessionResponse = z.infer<typeof joinSessionResponseSchema>;

/* ---------------------------------------------------- teacher onboarding */

export const teacherOnboardingResponseSchema = z.object({
  message: z.string(),
  teacher_profile_id: z.number().int(),
  user_id: z.number().int(),
  subject_ids: z.array(z.number().int()).default([]),
  specializations: z.array(z.string()).default([]),
});
export type TeacherOnboardingResponse = z.infer<typeof teacherOnboardingResponseSchema>;
