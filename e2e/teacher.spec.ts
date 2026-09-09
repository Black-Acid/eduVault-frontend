import { expect, test } from "@playwright/test";

import { expectNoMockData, hasTeacherCredentials, login, teacherCredentials } from "./helpers";

/**
 * Tutor-side coverage.
 *
 * The backend has no teacher dashboard or teacher session-list endpoint, and
 * `POST /teachers/onboarding` calls a service function that is commented out
 * (see docs/BACKEND_CONTRACT_GAPS.md). So this only asserts that a tutor is
 * routed correctly and shown an honest account page - there is no fabricated
 * dashboard to test.
 */
test.skip(
  !hasTeacherCredentials,
  "Set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD to run the tutor specs.",
);

test.describe("tutor account", () => {
  test("logs in and is routed to the tutor area", async ({ page }) => {
    await login(page, teacherCredentials.email!, teacherCredentials.password!);

    await page.waitForURL(/\/tutor/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/welcome/i);
  });

  test("shows no placeholder and no fabricated dashboard", async ({ page }) => {
    await login(page, teacherCredentials.email!, teacherCredentials.password!);
    await page.waitForURL(/\/tutor/);

    await expectNoMockData(page);

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Coming Soon");
    // Explicitly states what is not available rather than faking it.
    expect(body).toMatch(/not available in the app yet/i);
  });

  test("cannot reach the student area", async ({ page }) => {
    await login(page, teacherCredentials.email!, teacherCredentials.password!);
    await page.waitForURL(/\/tutor/);

    await page.goto("/student");
    await page.waitForURL(/\/tutor/);
  });
});
