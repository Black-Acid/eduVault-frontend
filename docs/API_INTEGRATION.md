# API integration

How the EduVault frontend talks to the backend, and the rules that keep the UI
honest about what the backend actually returns.

## Architecture

Every backend call is made from the server. The browser never sees the backend
URL and never holds a bearer token.

```
Browser
  │  same-origin fetch / navigation
  ▼
Next.js server  ──  Server Components (reads)
                └─  Route Handlers  (writes, app/api/*)
  │  reads the HTTP-only session cookie, attaches Authorization: Bearer <token>
  ▼
EduVault backend (EDUVAULT_API_URL)
```

Reads happen in Server Components (dashboard, sessions, tutors, subjects,
questions). Writes go through route handlers, because they need a request:
login, signup, logout, quiz submission, AI explanation, review-queue
resolution, booking and joining a session.

## Layout

```
lib/
  api/
    config.ts          base URL + timeouts (server-only)
    client.ts          apiFetch: timeout, auth, retry, parsing, validation
    errors.ts          ApiError, error kinds, user-facing messages
    schemas.ts         zod contracts for every response
    route-helpers.ts   ApiError -> HTTP response, request-body validation
    auth.ts  subjects.ts  quizzes.ts  dashboard.ts  tutors.ts  sessions.ts  ai.ts
  auth/
    roles.ts           the student/teacher contract
    session.ts         cookie shape, expiry, getSession/requireSession
  quiz/
    selection.ts       exact subject/paper resolution
    selector-state.ts  selector dependency rules
    review-queue.ts    AI-review queue
  tutors/
    subject-matching.ts  tutor subject names -> subject ids
    booking.ts           booking form validation
  dashboard/activity.ts  monthly activity + derived performance
  sessions/status.ts     session status presentation
  date/month.ts          month arithmetic and validation
  format.ts              percentages, currency, dates, durations, initials
```

## Endpoints used

| Frontend module | Endpoint | Auth | Cache |
| --- | --- | --- | --- |
| `api/auth.ts` | `POST /auth/login`, `POST /auth/signup` | — | no-store |
| `api/subjects.ts` | `GET /subjects` | — | `revalidate: 300` |
| `api/quizzes.ts` | `POST /questions` | — | no-store |
| `api/quizzes.ts` | `POST /papers/submit` | Bearer | no-store |
| `api/ai.ts` | `POST /ai/explain` | Bearer | no-store |
| `api/dashboard.ts` | `GET /dashboard?year=&month=` | Bearer | no-store |
| `api/tutors.ts` | `GET /tutors` | — | no-store |
| `api/sessions.ts` | `POST /sessions/book` | Bearer | no-store |
| `api/sessions.ts` | `GET /sessions/my-sessions` | Bearer | no-store |
| `api/sessions.ts` | `GET /sessions/{id}/join` | Bearer | no-store |

`GET /sessions/{id}/accept`, `/decline` and `/start` are tutor-side email
flows. The frontend never calls them and never handles their tokens.

### Caching

Anything user-specific is `cache: "no-store"`, so one student's dashboard can
never be served to another. `/subjects` is revalidated every 5 minutes — it is
public and changes rarely. `/tutors` is not cached, because availability and
ratings change independently of any deploy.

## Identity

`GET /dashboard` takes **only** `year` and `month`. The backend derives the
user from the bearer token (`current_user`), verified against the deployed
OpenAPI on 2026-09-09 and asserted by `npm run smoke:api`.

No client-supplied `user_id` or `student_id` is ever sent to any endpoint. The
same applies to joining a session: the client sends a session id, and the
backend re-verifies ownership and `LIVE` status before returning a meeting URL.

## Runtime validation

Every response is parsed with a zod schema before it reaches a component. A 2xx
body that does not match raises `ApiError` of kind `contract`, which renders an
error state — never partial or coerced data.

The schemas also absorb the backend's looser serialisation:

| Field | Backend | Frontend |
| --- | --- | --- |
| `Paper.year` | number or numeric string | `number` |
| `Paper.paper_number` | number or string | `string` |
| `Tutor.session_fee` | stringified Decimal (`"50.0"`) | `number` |
| `SessionStatus` | enum string | upper-cased string; unknown values render neutrally |
| `total_duration_minutes` | `int | null`, may be omitted | `number | null` — **null is preserved** |
| `strongest_topic` | always `null` today | `null` |

## Failure modes

An outage must never look like an empty result. `apiFetch` distinguishes:

| Kind | Cause | HTTP from the BFF |
| --- | --- | --- |
| `config` | `EDUVAULT_API_URL` missing or invalid | 500 |
| `unauthorized` | 401 | 401 |
| `forbidden` | 403 | 403 |
| `not_found` | 404 | 404 |
| `validation` | 400 / 409 / 422 | upstream status |
| `upstream_unavailable` | 5xx, DNS/network failure, HTML error page | 502 |
| `timeout` | our own abort | 504 |
| `contract` | 2xx body fails its schema | 502 |
| `unexpected` | anything else | 500 |

There is no `catch { return [] }` anywhere in `lib/` or `app/`. The one place a
failure degrades quietly is the dashboard's *optional* `/subjects` fetch, which
only supplies subject ids for "Practice subject" links; if it fails, the links
fall back to the unfiltered quiz selector and no displayed figure changes.

### Timeouts and retries

Default 15s; 45s for endpoints that may hit a Render cold start; 60s for
`POST /ai/explain`, which waits on Gemini.

`GET` is retried once on a 5xx or a network failure. **Mutations are never
retried** — replaying a booking or a submission would create duplicates.

## Authentication

`POST /api/login` and `/api/signup` exchange credentials for an HTTP-only
cookie and return only `{ name, role, redirectTo }`. The access token is never
in a response body, never in client JavaScript, never logged.

Cookie: `httpOnly`, `secure` in production, `sameSite: lax`, `path: /`, and a
`maxAge` derived from the backend's own `expires_at` rather than a fixed guess.

`middleware.ts` is navigation protection only — the backend authorises every
call. It parses the cookie, treats an expired or malformed session as signed
out, clears it, and redirects to `/login?returnTo=<same-origin path>`. A 401
from an API call is treated the same way.

### Roles

The backend's educator role is `teacher`. `tutor` is a display label only. See
`lib/auth/roles.ts`; legacy `tutor` accounts are routed to `/tutor` for
compatibility but are never created (gap #2 in
[BACKEND_CONTRACT_GAPS.md](./BACKEND_CONTRACT_GAPS.md)).

## Quiz paper selection

Selections travel as stable backend ids:

```
/student/play-quiz?subjectId=6&paperId=7
```

The server fetches `/subjects`, finds the subject, then finds the paper **within
that subject**, and takes the subject name, year and paper number from that one
record. A paper id belonging to a different subject resolves to `null` and the
selector is shown — it never falls back to `papers[0]`.

The selector enforces the dependency: changing the subject clears the year and
paper; changing the year clears the paper; only papers for the chosen
subject *and* year are offered.

## AI review queue

`POST /papers/submit` returns `wrong_questions`. The submit route handler builds
the review queue from that and writes it to an HTTP-only cookie. The browser
cannot read or rewrite it; `/api/resolve-question` advances it server-side.

This is session-scoped frontend state. **The backend does not persist review
progress** — that is not simulated. Authorisation still rests with the backend:
`POST /ai/explain` independently verifies the attempt belongs to the caller.

## Booking

`GET /tutors` returns subject *names*; `POST /sessions/book` needs a
`subject_id`. Names are resolved against `/subjects` by exact, case-insensitive
match. An unresolved name is never guessed — it is excluded from the form and
reported to the student.

There is no timeslot API, so no availability is invented: the student proposes
a time, and the result is reported as `PENDING` with an explanation that the
tutor must accept. It is never optimistically shown as confirmed.

## Logging

Server logs carry endpoint, method, status and duration, plus the error kind on
failure. They never contain a password, an access token, an Authorization
header, or a request body.
