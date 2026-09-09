import { expect, type Page } from "@playwright/test";

/**
 * Shared E2E helpers.
 *
 * Credentials come from the environment only. Nothing here creates an account,
 * so running the suite never writes new users to whichever backend is
 * configured.
 */

export const studentCredentials = {
  email: process.env.E2E_STUDENT_EMAIL,
  password: process.env.E2E_STUDENT_PASSWORD,
};

export const teacherCredentials = {
  email: process.env.E2E_TEACHER_EMAIL,
  password: process.env.E2E_TEACHER_PASSWORD,
};

export const hasStudentCredentials = Boolean(
  studentCredentials.email && studentCredentials.password,
);

export const hasTeacherCredentials = Boolean(
  teacherCredentials.email && teacherCredentials.password,
);

/** Domain data that must never reappear in the shipped UI. */
export const FORBIDDEN_MOCK_STRINGS = [
  "Ama Mensah",
  "Kofi Asare",
  "Esi Boateng",
  "Yaw Ofori",
  "18h 42m",
  "WASSCE 2024 Paper 2",
  "16 / 20 questions completed",
  "12 minutes ago",
  "12,400+",
  "Quesion 1 of 40",
  "Question 1 of 40",
  "tutors online now",
  "Coming Soon...",
  "Organic Chemistry — 42% mastery",
  "Practice weakest topic",
  "Estimated readiness",
];

export async function expectNoMockData(page: Page): Promise<void> {
  const body = await page.locator("body").innerText();

  for (const forbidden of FORBIDDEN_MOCK_STRINGS) {
    expect(body, `page still contains mock data: ${forbidden}`).not.toContain(forbidden);
  }
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();
}

export async function loginAsStudent(page: Page): Promise<void> {
  await login(page, studentCredentials.email!, studentCredentials.password!);
  await page.waitForURL(/\/student/);
}

/** Fails the test if the browser logged an error or a request failed. */
export function collectPageProblems(page: Page): { errors: string[]; failures: string[] } {
  const errors: string[] = [];
  const failures: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  page.on("pageerror", (error) => errors.push(error.message));

  page.on("requestfailed", (request) => {
    failures.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  return { errors, failures };
}
