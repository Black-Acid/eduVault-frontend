# Production readiness

Status of the EduVault frontend, and what was actually verified.

**Verified on:** 2026-09-09
**Frontend commit audited:** `d1d0ab3` (`main`)
**Backend commit inspected:** `1b45a6d` (`main`)
**Backend deployment:** `https://eduvault-jadl.onrender.com`

---

## Summary

The frontend is production-ready **for the features the backend supports
today**. Every figure it displays comes from the API; anything the backend does
not implement is shown as an explicit unavailable or empty state rather than
being filled in.

Three backend defects still block a real launch, none of which the frontend can
work around: a hard-coded JWT signing key, tutor emails sent to a hard-coded
personal address, and `127.0.0.1` accept/decline links. See
[BACKEND_CONTRACT_GAPS.md](./BACKEND_CONTRACT_GAPS.md).

---

## Quality gates

All run against the current tree.

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Pass — 0 errors, 0 warnings |
| Types | `npm run typecheck` | Pass — 0 errors |
| Unit + component | `npm test` | **369 passed**, 24 files |
| Coverage | `npm run test:coverage` | 80.4% statements, 80.1% branches (excludes `components/ui/**`) |
| Production build | `npm run build` | Pass — 18 routes |
| E2E (public + BFF) | `npm run test:e2e` | **36 passed**, 30 skipped |
| Live contract smoke | `npm run smoke:api` | **20/20 checks passed** against the deployed API (see the outage note below) |

### What the E2E skips mean

30 of 66 E2E cases are authenticated (dashboard figures, quiz submission,
booking, sessions, AI review, tutor routing). They are written and wired up but
skip unless `E2E_STUDENT_EMAIL` / `E2E_STUDENT_PASSWORD` (and
`E2E_TEACHER_*`) are set.

They were deliberately left unexecuted: running them needs a real account, and
creating one would write records to the production database. Supply staging
credentials and they run unchanged.

Those flows are covered by unit and component tests in the meantime — quiz
submission, booking, session join, AI review and auth all have component tests
driving the real components against stubbed responses, and the BFF's
authentication behaviour is covered by live E2E checks against the running
production build.

### Browser verification

The production build (`npm run start`, not `next dev`) was driven with a real
Chromium instance at 375, 768, 1280 and 1920 px across `/`, `/login` and
`/signup`:

- no console errors,
- no failed network requests,
- no horizontal overflow at any width.

One layout defect was found and fixed this way: subject names in the landing
coverage grid broke mid-word on a 375 px viewport.

Authenticated pages could not be checked in a browser for the same reason the
E2E specs skip.

---

## Observed during verification: a real backend outage

Partway through this work the deployed backend began returning **HTTP 500** for
`GET /subjects` and `GET /tutors` — reproducibly, over several minutes — while
`GET /` still answered `{"status":"ok"}`. It had returned valid data for both
endpoints earlier the same day. The failure looks like a data-layer problem on
the hosted instance rather than anything in the API contract.

That turned into an unplanned test of the central rule of this work, and the
frontend behaved correctly:

- **The landing page rendered "Subject coverage is unavailable — EduVault's
  servers are not responding right now."** It did not render an empty grid, and
  it did not fall back to a fabricated subject list.
- **The production build still succeeded.** The `/subjects` failure was caught
  and rendered as an error state rather than aborting the build.
- **All 36 E2E tests still passed**, because the coverage assertion accepts
  either the real catalogue or the honest unavailable state — and separately
  asserts the fabricated inventory never appears.
- **The plain-text `Internal Server Error` body** exercised the non-JSON
  upstream path in `apiFetch`, which classified it as
  `upstream_unavailable` rather than treating it as a payload.

Two consequences worth noting:

1. `npm run smoke:api` reports **14/16** while the outage lasts (`/subjects`
   and `/tutors` fail); it reported 20/20 when the backend was healthy. The
   script is doing its job — the failures are real and upstream.
2. Because `/` is statically generated with `revalidate: 300`, a build that
   happens during an outage bakes the error state in for up to five minutes
   before the next revalidation. That is the intended trade-off, but it is
   worth knowing when deploying.

---

## Mock-data audit

A static scan of `app/`, `components/`, `lib/`, `hooks/` and `middleware.ts`
found no occurrences of:

```text
mockActivity          masterySubjects       readinessRows
const tutors = [      Ama Mensah            Kofi Asare
Esi Boateng           Yaw Ofori             18h 42m
WASSCE 2024 Paper 2   16 / 20 questions completed
12 minutes ago        12,400+               Quesion 1 of 40
Coming Soon...        papers[0].id          This is sample data
Create Next App
```

Also confirmed:

- **No hard-coded backend URL** in production source. It appears only in
  `.env.example`, documentation, tests and the smoke-test script.
- **No `NEXT_PUBLIC_*`** variable is used for API access.
- **No `document.cookie` writes of business data.** The only remaining write is
  the shadcn sidebar's open/closed preference, which is UI state.
- **No `dangerouslySetInnerHTML`** anywhere.
- **No `catch { return [] }`.** The remaining bare `return []` sites are
  error-payload parsing, an absent review-queue cookie, and selector options
  before a subject is chosen — none is an API-failure fallback.
- **No `Math.random()`** in business data. The sidebar skeleton's random
  placeholder width was made deterministic, because it also caused a hydration
  mismatch.

---

## What each screen shows now

| Screen | Source | Unsupported things it no longer claims |
| --- | --- | --- |
| Landing | `GET /subjects` | Student counts, question totals, Core/Elective labels, tutor messaging, quiz resume, untimed mode |
| Student dashboard | `GET /dashboard` | Fixed 68%/76%/328/18h 42m, fabricated topic mastery, WASSCE readiness band, fake unfinished quiz, random 365-day heatmap |
| Quiz selector | `GET /subjects` | — (now uses exact ids) |
| Quiz | `POST /questions`, `POST /papers/submit` | — |
| AI review | `POST /ai/explain` | "Question 1 of 40", simulated follow-up chat |
| Tutors | `GET /tutors`, `GET /subjects` | Four fabricated tutors, fake ratings, prices, availability, "4 tutors online now" |
| Sessions | `GET /sessions/my-sessions` | — (all six statuses handled) |
| Tutor | Session cookie | "Coming Soon..." placeholder; states plainly what is unavailable |

---

## Security posture

| Control | Status |
| --- | --- |
| Bearer token in the browser | No — HTTP-only cookie, server-read only |
| Token in a response body | No — login/signup return `{ name, role, redirectTo }` |
| Token in logs | No — logs carry endpoint, status, duration, error kind |
| Cookie flags | `httpOnly`, `secure` in production, `sameSite=lax`, `path=/` |
| Cookie lifetime | Derived from the backend's `expires_at`, not a fixed guess |
| Expired session | Detected in middleware, cookies cleared, redirect to login |
| 401 despite a cookie | Treated as an invalid session |
| Client-supplied user ids | None sent to any endpoint |
| Session join | Goes through `GET /sessions/{id}/join`; the backend re-verifies ownership and LIVE status |
| Meeting URLs | Validated as `http(s)` before opening; `noopener,noreferrer` |
| Open redirect | `returnTo` restricted to same-origin paths |
| Secrets in `NEXT_PUBLIC_*` | None |
| Role as authorisation | No — middleware is navigation only |

**Not mitigable here:** the backend's JWT signing key is committed to a public
repository. Until it is moved to configuration and rotated, anyone can mint a
token for any user, and no frontend control changes that.

---

## Known limitations

Behaviour that is correct given the backend, but worth knowing:

1. **Unanswered quiz questions cannot be AI-reviewed.** They count as wrong but
   produce no `StudentAnswer` row. The UI says so before and after submission.
2. **AI-review progress is session-scoped.** It lives in an HTTP-only cookie
   for two hours; the backend does not persist it. Clearing cookies or
   switching device loses the queue.
3. **Study time, topic mastery and quiz resume are not available.** Each shows
   an explicit unavailable or empty state.
4. **Activity for the last day of a month may read as zero** — a backend
   off-by-one the frontend cannot detect.
5. **Sessions may never leave `PENDING` in production**, because tutor emails
   go to a hard-coded address and the accept links point at localhost.
6. **Tutor onboarding is unavailable**, because the backend service function is
   commented out.
7. **Legacy `role = "tutor"` accounts** are routed to `/tutor` but still lack a
   `TeacherProfile`; only a backend migration can repair them.
8. **`middleware.ts` emits a deprecation warning** on Next 16 ("use proxy
   instead"). It functions correctly; the rename was left alone rather than
   risk an auth-routing regression. Worth doing as a separate change.

---

## Before deploying

1. Set `EDUVAULT_API_URL` in the hosting environment. The build fails fast
   without it rather than falling back to a literal.
2. Run `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
3. Run `npm run smoke:api` against the target backend.
4. Point `E2E_*` at a staging account and run `npm run test:e2e` in full.
5. Fix backend gaps 1, 3, 4 and 5 from
   [BACKEND_CONTRACT_GAPS.md](./BACKEND_CONTRACT_GAPS.md).

A clean `.next` is worth using in CI (`rm -rf .next` before `next build`);
incremental rebuilds during this work occasionally left prerendered HTML
pointing at a pruned CSS chunk.
