import { expect, test } from "@playwright/test";

import { collectPageProblems, expectNoMockData } from "./helpers";

test.describe("public landing page", () => {
  test("loads without console errors or failed requests", async ({ page }) => {
    const problems = collectPageProblems(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Practice WASSCE");

    expect(problems.errors, problems.errors.join("\n")).toEqual([]);
    expect(problems.failures, problems.failures.join("\n")).toEqual([]);
  });

  test("is branded as EduVault, not as a create-next-app default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/EduVault/);
    await expect(page).not.toHaveTitle(/Create Next App/);
  });

  test("shows real subject coverage from the backend", async ({ page, request }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();

    await page.goto("/");

    const coverage = page.getByRole("heading", { name: /the subjects on eduvault today/i });
    await expect(coverage).toBeVisible();

    const section = page.locator("section").filter({ has: coverage });
    const text = await section.innerText();

    // Either the real catalogue rendered, or an honest unavailable state - but
    // never the old fabricated inventory.
    const rendered = /\d+\s+papers?/i.test(text);
    const unavailable = /subject coverage is unavailable/i.test(text);
    expect(rendered || unavailable).toBeTruthy();

    // The old page listed invented question totals per subject.
    expect(text).not.toMatch(/\d{3,4}\s+questions/i);
    expect(text).not.toMatch(/\bCore\b|\bElective\b/);
  });

  test("makes no unsupported product claims", async ({ page }) => {
    await page.goto("/");
    await expectNoMockData(page);

    const body = await page.locator("body").innerText();

    // Messaging, quiz resume and untimed mode are not implemented anywhere.
    expect(body).not.toMatch(/message a tutor/i);
    expect(body).not.toMatch(/pick up right where you stopped/i);
    expect(body).not.toMatch(/untimed/i);
  });

  test("offers navigation to login and signup", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /get started as a student/i }).first().click();
    await page.waitForURL(/\/signup/);
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();

    await page.getByRole("link", { name: /log in/i }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("button", { name: /^log in$/i })).toBeVisible();
  });

  test("does not expose the backend URL to the browser", async ({ page }) => {
    await page.goto("/");

    const html = await page.content();
    expect(html).not.toContain("eduvault-jadl.onrender.com");
  });
});

test.describe("route protection", () => {
  for (const path of ["/student", "/student/sessions", "/student/play-quiz", "/tutor"]) {
    test(`redirects an anonymous visitor from ${path} to login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/returnTo=/);
    });
  }
});

test.describe("BFF route protection", () => {
  // These endpoints proxy protected backend calls. Without a session cookie
  // they must refuse - they must never fall through to a 200 with empty data.
  const protectedRoutes = [
    { path: "/api/submit-quiz", body: { paper_id: 1, answers: [] } },
    { path: "/api/chat-ai", body: { attempt_id: 1, question_id: 1 } },
    { path: "/api/resolve-question", body: { attempt_id: 1, question_id: 1 } },
    {
      path: "/api/sessions/book",
      body: { tutor_id: 1, subject_id: 1, scheduled_at: "2030-01-01T10:00:00Z", duration_minutes: 60 },
    },
    { path: "/api/sessions/1/join", body: {} },
  ];

  for (const route of protectedRoutes) {
    test(`${route.path} rejects an unauthenticated request`, async ({ request }) => {
      const response = await request.post(route.path, { data: route.body });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.kind).toBe("unauthorized");
      expect(body.error).toBeTruthy();
    });
  }

  test("login rejects a malformed body with a validation error, not a 200", async ({ request }) => {
    const response = await request.post("/api/login", { data: { email: "" } });

    expect(response.status()).toBe(422);
    expect((await response.json()).kind).toBe("validation");
  });

  test("signup refuses the legacy 'tutor' role", async ({ request }) => {
    const response = await request.post("/api/signup", {
      data: {
        name: "Test Person",
        email: "someone@example.com",
        password: "secret123",
        role: "tutor",
      },
    });

    expect(response.status()).toBe(422);
    expect((await response.json()).kind).toBe("validation");
  });

  test("logout clears the session cookies", async ({ request }) => {
    const response = await request.post("/api/logout");
    expect(response.ok()).toBeTruthy();

    const setCookies = response.headersArray().filter((header) => header.name.toLowerCase() === "set-cookie");
    expect(setCookies.some((header) => header.value.includes("eduvault_session"))).toBeTruthy();
  });
});
