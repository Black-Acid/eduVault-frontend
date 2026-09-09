# EduVault — frontend

Practise WASSCE past questions, track your progress, get an AI explanation for
every answer you got wrong, and book a session with a tutor.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Base UI · Zod

---

## Principle

**Everything on screen comes from the backend.** No student names, scores,
mastery percentages, tutors, prices, availability or activity is hard-coded or
generated. Where the backend does not implement something, the UI says so
instead of filling in a plausible number.

Static UI configuration — navigation labels, colours, month names, validation
bounds mirroring the API — is hard-coded, and that is fine. Business data is
not.

## Getting started

```bash
npm ci
cp .env.example .env.local     # then set EDUVAULT_API_URL
npm run dev
```

Open <http://localhost:3000>.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `EDUVAULT_API_URL` | Yes | Base URL of the EduVault backend |

`EDUVAULT_API_URL` is **server-only** by design. Every backend call is made
from a Server Component or a route handler, so the browser never needs the
address and never holds a bearer token. Do not rename it to `NEXT_PUBLIC_*`.

If it is missing, the app raises a `config` error rather than silently falling
back to a URL literal.

Optional, for end-to-end tests only (never committed):

```
E2E_BASE_URL, E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD,
E2E_TEACHER_EMAIL, E2E_TEACHER_PASSWORD
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit + component tests |
| `npm run test:coverage` | Tests with coverage |
| `npm run test:e2e` | Playwright (needs a build; authenticated specs need `E2E_*`) |
| `npm run test:e2e:install` | Install the Playwright browser |
| `npm run smoke:api` | Non-destructive contract check against a live backend |

## Architecture

```
Browser
  │  same-origin only
  ▼
Next.js server
  ├─ Server Components   reads  (dashboard, sessions, tutors, subjects, questions)
  └─ Route Handlers      writes (app/api/*)
  │  HTTP-only session cookie -> Authorization: Bearer <token>
  ▼
EduVault backend
```

The browser talks only to this app. The backend URL and the access token stay
on the server.

```
app/
  (base)/           landing page
  login/  signup/   auth
  api/              the BFF: login, signup, logout, submit-quiz, chat-ai,
                    resolve-question, sessions/book, sessions/[id]/join
  student/          dashboard, play-quiz, chat-ai, available-tutors, sessions
  tutor/            tutor account page
components/
  dashboard/  quiz/  chat-ai/  tutors/  sessions/  general/  student/  ui/
lib/
  api/              config, client, errors, schemas, route-helpers, endpoints
  auth/             roles, session
  quiz/             selection, selector-state, review-queue
  tutors/           subject-matching, booking
  dashboard/  date/  sessions/  format.ts
```

Full detail: **[docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md)**.

### Rules the code follows

- **A failure is never an empty result.** `apiFetch` raises a typed `ApiError`
  — `unauthorized`, `validation`, `upstream_unavailable`, `timeout`,
  `contract`, `config` — and the UI renders the matching state. There is no
  `catch { return [] }`.
- **Responses are validated at runtime.** Every response is parsed with a Zod
  schema; a 2xx body that does not match raises a `contract` error rather than
  reaching a component.
- **`null` is not `0`.** `total_duration_minutes: null` renders as "Not tracked
  yet", never `0m`.
- **Mutations are never retried.** `GET` retries once on a 5xx; booking and
  submission never do.
- **Identity comes from the token.** No client-supplied `user_id` is sent
  anywhere.
- **The educator role is `teacher`.** "Tutor" is a display label only — sending
  `tutor` creates an account the backend cannot use.
- **Quiz selections travel as backend ids** (`?subjectId=&paperId=`), resolved
  to exactly one Paper record. No `papers[0]` fallback.

## Testing

```bash
npm test              # 369 unit + component tests
npm run test:coverage
npm run test:e2e      # public + BFF specs; authenticated ones need E2E_*
npm run smoke:api     # contract check against the deployed backend
```

Test fixtures live in `tests/fixtures.ts` and are imported only by tests —
never by `app/`, `components/` or `lib/`.

The authenticated E2E specs skip without credentials, so running the suite
never creates accounts or records on whatever backend is configured.

## Deployment

```bash
npm ci
npm run lint && npm run typecheck && npm test
npm run build
npm start
```

Set `EDUVAULT_API_URL` in the hosting environment. Use a clean `.next` in CI.

## Backend dependencies

This frontend is a client of
[EduVault](https://github.com/Black-Acid/EduVault). Several features it could
offer are blocked by backend defects or missing endpoints — a hard-coded JWT
secret, tutor emails sent to a hard-coded address, localhost accept/decline
links, teacher onboarding calling a commented-out function, and no teacher
dashboard API.

Each one is documented with evidence, impact and a recommended fix in
**[docs/BACKEND_CONTRACT_GAPS.md](./docs/BACKEND_CONTRACT_GAPS.md)**.

Current status and what was verified:
**[docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md)**.
