#!/usr/bin/env node
/**
 * Non-destructive contract smoke test against a running EduVault backend.
 *
 * Reads only. It performs no signup, no booking and no quiz submission, so it
 * is safe to point at production. Authenticated checks run only when
 * E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD are set, and even then they only
 * issue GETs.
 *
 *   npm run smoke:api
 *
 * Exit code 0 means every checked contract matched.
 */

const BASE_URL = (process.env.EDUVAULT_API_URL ?? "https://eduvault-jadl.onrender.com").replace(
  /\/+$/,
  "",
);

const TIMEOUT_MS = 60_000;

let failures = 0;
let checks = 0;

function report(name, ok, detail = "") {
  checks += 1;
  if (!ok) failures += 1;
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` - ${detail}` : ""}`);
}

async function getJson(path, token) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return { status: response.status, body, raw: text };
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function checkHealth() {
  const { status, body } = await getJson("/");
  report("GET /", status === 200 && body?.status === "ok", `status=${status}`);
}

async function checkOpenApi() {
  const { status, body } = await getJson("/openapi.json");
  const paths = isObject(body?.paths) ? Object.keys(body.paths) : [];

  report("GET /openapi.json", status === 200 && paths.length > 0, `${paths.length} paths`);

  const expected = [
    "/auth/login",
    "/auth/signup",
    "/subjects",
    "/questions",
    "/papers/submit",
    "/ai/explain",
    "/dashboard",
    "/tutors",
    "/sessions/book",
    "/sessions/my-sessions",
    "/sessions/{session_id}/join",
  ];

  for (const path of expected) {
    report(`  declares ${path}`, paths.includes(path));
  }

  // The frontend must never send a user id: the dashboard derives it from the token.
  const dashboardParams = (body?.paths?.["/dashboard"]?.get?.parameters ?? []).map(
    (parameter) => parameter.name,
  );

  report(
    "  /dashboard takes only year and month",
    dashboardParams.length === 2 &&
      dashboardParams.includes("year") &&
      dashboardParams.includes("month"),
    dashboardParams.join(", ") || "no parameters",
  );
}

async function checkSubjects() {
  const { status, body } = await getJson("/subjects");
  const ok = status === 200 && Array.isArray(body);

  report("GET /subjects", ok, `status=${status}${ok ? `, ${body.length} subjects` : ""}`);
  if (!ok || body.length === 0) return;

  const subject = body[0];
  report(
    "  subject has id, name and papers",
    typeof subject.id === "number" && typeof subject.name === "string" && Array.isArray(subject.papers),
  );

  const paper = body.flatMap((item) => item.papers ?? [])[0];
  if (paper) {
    report(
      "  paper has id, year and paper_number",
      typeof paper.id === "number" &&
        ["number", "string"].includes(typeof paper.year) &&
        ["number", "string"].includes(typeof paper.paper_number),
      `year=${typeof paper.year}, paper_number=${typeof paper.paper_number}`,
    );
  }
}

async function checkTutors() {
  const { status, body } = await getJson("/tutors");
  const ok = status === 200 && Array.isArray(body);

  report("GET /tutors", ok, `status=${status}${ok ? `, ${body.length} tutors` : ""}`);
  if (!ok || body.length === 0) return;

  const tutor = body[0];
  report(
    "  tutor has the documented fields",
    typeof tutor.id === "number" &&
      typeof tutor.full_name === "string" &&
      typeof tutor.is_available_today === "boolean" &&
      ["number", "string"].includes(typeof tutor.session_fee),
    `session_fee is a ${typeof tutor.session_fee}`,
  );

  report(
    "  tutor.subjects are names, not {id, name} objects",
    Array.isArray(tutor.subjects) && tutor.subjects.every((item) => typeof item === "string"),
    "booking needs subject_id - see docs/BACKEND_CONTRACT_GAPS.md",
  );
}

async function checkAuthenticated() {
  const email = process.env.E2E_STUDENT_EMAIL;
  const password = process.env.E2E_STUDENT_PASSWORD;

  if (!email || !password) {
    console.log("\nSKIP  authenticated checks (set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD)");
    return;
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const auth = await response.json().catch(() => null);
  const loggedIn = response.ok && typeof auth?.access_token === "string";

  report("POST /auth/login", loggedIn, `status=${response.status}`);
  if (!loggedIn) return;

  report(
    "  role is 'student' or 'teacher', never 'tutor'",
    auth.role === "student" || auth.role === "teacher",
    `role=${auth.role}`,
  );

  report("  returns expires_at", typeof auth.expires_at === "string", auth.expires_at ?? "missing");

  const now = new Date();
  const { status, body } = await getJson(
    `/dashboard?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
    auth.access_token,
  );

  const dashboardOk = status === 200 && isObject(body);
  report("GET /dashboard", dashboardOk, `status=${status}`);

  if (dashboardOk) {
    report("  has user.name", typeof body.user?.name === "string");
    report("  has overview.current_streak", typeof body.overview?.current_streak === "number");
    report(
      "  total_duration_minutes is null (not implemented upstream)",
      body.overview?.total_duration_minutes === null,
      `value=${JSON.stringify(body.overview?.total_duration_minutes)}`,
    );
    report(
      "  unfinished_quizzes is empty (not implemented upstream)",
      Array.isArray(body.unfinished_quizzes) && body.unfinished_quizzes.length === 0,
    );
    report("  monthly_activity.days is an array", Array.isArray(body.monthly_activity?.days));
  }

  const sessions = await getJson("/sessions/my-sessions", auth.access_token);
  report(
    "GET /sessions/my-sessions",
    sessions.status === 200 && Array.isArray(sessions.body),
    `status=${sessions.status}`,
  );
}

async function main() {
  console.log(`EduVault backend contract smoke test\nBase URL: ${BASE_URL}\n`);

  await checkHealth();
  await checkOpenApi();
  await checkSubjects();
  await checkTutors();
  await checkAuthenticated();

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Smoke test could not complete:", error?.message ?? error);
  process.exit(1);
});
