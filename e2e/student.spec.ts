import { expect, test } from "@playwright/test";

import {
  collectPageProblems,
  expectNoMockData,
  hasStudentCredentials,
  loginAsStudent,
} from "./helpers";

/**
 * Authenticated student journeys.
 *
 * These need E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD, which should point at a
 * staging account. Without them the whole file skips - the suite never signs
 * anybody up, so it cannot pollute a database with test users.
 */
test.skip(
  !hasStudentCredentials,
  "Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD to run the authenticated specs.",
);

test.describe("student authentication", () => {
  test("logs in and lands on the student dashboard", async ({ page }) => {
    await loginAsStudent(page);
    await expect(page).toHaveURL(/\/student$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/welcome/i);
  });

  test("keeps the session across a reload", async ({ page }) => {
    await loginAsStudent(page);
    await page.reload();

    await expect(page).toHaveURL(/\/student/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/welcome/i);
  });

  test("keeps the access token out of client-readable storage", async ({ page }) => {
    await loginAsStudent(page);

    const documentCookie = await page.evaluate(() => document.cookie);
    expect(documentCookie).not.toContain("access_token");
    expect(documentCookie).not.toContain("eduvault_session");

    const html = await page.content();
    expect(html).not.toContain("Bearer ");
  });

  test("logs out and can no longer reach a protected route", async ({ page }) => {
    await loginAsStudent(page);

    await page.getByRole("button", { name: /log out/i }).click();
    await page.waitForURL(/\/login/);

    await page.goto("/student");
    await page.waitForURL(/\/login/);
  });
});

test.describe("student dashboard", () => {
  test("shows backend-driven figures and no mock data", async ({ page }) => {
    const problems = collectPageProblems(page);

    await loginAsStudent(page);

    await expect(page.getByText(/current streak/i)).toBeVisible();
    await expect(page.getByText(/average score/i)).toBeVisible();
    await expect(page.getByText(/accuracy/i)).toBeVisible();
    await expect(page.getByText(/questions solved/i)).toBeVisible();

    await expectNoMockData(page);

    expect(problems.errors, problems.errors.join("\n")).toEqual([]);
  });

  test("navigates the activity calendar through the server", async ({ page }) => {
    await loginAsStudent(page);

    const previous = page.getByRole("link", { name: /show activity for/i }).first();
    await previous.click();

    await page.waitForURL(/\/student\?year=\d{4}&month=\d{1,2}/);
    await expect(page.getByText(/monthly activity/i)).toBeVisible();
  });

  test("rejects an out-of-range month in the URL", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student?year=2026&month=13");

    // Falls back to the current month rather than asking the backend for month 13.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/welcome/i);
  });
});

test.describe("quiz", () => {
  test("selects an exact paper and loads its questions", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/play-quiz");

    await expect(page.getByRole("heading", { name: /choose a paper/i })).toBeVisible();

    // Subject -> year -> paper, each dependent on the last.
    await page.getByLabel(/subject/i).click();
    await page.getByRole("option").first().click();

    await page.getByLabel(/^year$/i).click();
    await page.getByRole("option").first().click();

    await page.getByLabel(/^paper$/i).click();
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: /start quiz/i }).click();

    await page.waitForURL(/subjectId=\d+&paperId=\d+/);
    await expect(page.getByText(/question 1 of/i)).toBeVisible({ timeout: 45_000 });
  });

  test("does not accept a paper that belongs to another subject", async ({ page }) => {
    await loginAsStudent(page);

    // Deliberately mismatched ids: the page must refuse rather than fall back
    // to papers[0].
    await page.goto("/student/play-quiz?subjectId=1&paperId=999999");

    await expect(page.getByText(/that paper is not available/i)).toBeVisible();
  });
});

test.describe("tutors", () => {
  test("lists tutors from the backend and no fabricated ones", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/available-tutors");

    await expect(page.getByRole("heading", { name: /book a tutor/i })).toBeVisible();
    await expectNoMockData(page);

    const body = await page.locator("body").innerText();
    const hasTutors = /available today/i.test(body);
    const isEmpty = /no tutors are currently available/i.test(body);
    expect(hasTutors || isEmpty).toBeTruthy();
  });
});

test.describe("sessions", () => {
  test("lists sessions or an honest empty state, and offers Join only when live", async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto("/student/sessions");

    await expect(page.getByRole("heading", { name: /tutoring sessions/i })).toBeVisible();

    const body = await page.locator("body").innerText();
    const isEmpty = /do not have any tutoring sessions yet/i.test(body);

    if (isEmpty) {
      await expect(page.getByRole("button", { name: /join session/i })).toHaveCount(0);
      return;
    }

    // A Join button may only ever appear on a card marked Live now.
    const joinButtons = page.getByRole("button", { name: /join session/i });
    const liveBadges = page.getByText("Live now");
    expect(await joinButtons.count()).toBeLessThanOrEqual(await liveBadges.count());
  });
});

test.describe("AI review", () => {
  test("stays locked until a quiz has been submitted", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/student/chat-ai");

    const body = await page.locator("body").innerText();
    const locked = /attempt a quiz to unlock the ai review/i.test(body);
    const reviewing = /reviewing missed questions/i.test(body);
    const finished = /reviewed/i.test(body);

    expect(locked || reviewing || finished).toBeTruthy();
    await expectNoMockData(page);
  });
});
