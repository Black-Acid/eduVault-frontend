# Backend contract gaps

Defects and missing contracts in the EduVault backend that limit what the
frontend can honestly do.

**Scope of this document.** The frontend work in this repository was completed
against the deployed API. The backend repository was cloned read-only for
verification; no backend code was changed. Everything below is either verified
against the live API or verified by reading the backend source at the commit
that is deployed.

| | |
| --- | --- |
| Backend repository | `https://github.com/Black-Acid/EduVault` |
| Commit inspected | `1b45a6d` (`main`, HEAD at the time of writing) |
| Deployed API | `https://eduvault-jadl.onrender.com` |
| OpenAPI verified | 2026-09-09, 16 paths, matches the source at `1b45a6d` |

Evidence is marked as:

- **Live** — reproduced against the deployed API.
- **Source** — read in the backend source at the deployed commit; not exercised
  against production, because doing so would have written records.

---

## 1. `POST /teachers/onboarding` calls a function that does not exist

**Severity: critical — the endpoint cannot succeed.**

`main.py` routes teacher onboarding to `sv.onboard_teacher(...)`:

```python
# eduVault/main.py:172
teacher_profile = sv.onboard_teacher(
```

but the only definition of `onboard_teacher` in `services.py` is commented out:

```python
# eduVault/services.py:1278
# def onboard_teacher(
```

Any authenticated call therefore raises `AttributeError` and returns 500.

**Evidence:** Source. Not exercised live: the endpoint is authenticated, so
proving it would have required creating a teacher account on the production
database.

**Frontend impact.** Tutors cannot set their bio, location, fee, subjects or
specialisations from the app. `/tutor` therefore states plainly what a tutor
can and cannot do rather than presenting a profile editor that would always
fail.

**Recommended fix.** Restore the implementation, or remove the route until it
exists. Add a test that calls the endpoint with a teacher token and asserts a
`TeacherProfile` row is created and linked to the requested subjects.

---

## 2. Educator role is `teacher`, but the previous frontend sent `tutor`

**Severity: critical — produced unusable accounts.**

Signup only creates a profile row for two exact values:

```python
# eduVault/services.py:155
if normalized_role == "student":
    db.add(StudentProfile(user_id=user.id))
elif normalized_role == "teacher":
    db.add(TeacherProfile(user_id=user.id))
```

and tutor discovery filters on the same value:

```python
# eduVault/services.py:1132
.filter(User.role == "teacher")
```

Signing up with `role="tutor"` created a `User` with **no** `TeacherProfile`.
Such an account can never appear in `GET /tutors` and can never be booked.

**Evidence:** Source.

**Frontend impact.** Fixed on the frontend: `lib/auth/roles.ts` makes
`"student" | "teacher"` the only values ever sent, and the signup route rejects
anything else (covered by an E2E test). "Tutor" survives as a display label
only.

**Still needs a backend fix.** Accounts already stored with `role = "tutor"`
cannot be repaired from the frontend, because normalising the string does not
create the missing `TeacherProfile` row. A migration should:

1. update `Users.role` from `'tutor'` to `'teacher'`; and
2. insert a `TeacherProfile` for every affected user that lacks one.

The frontend routes those users to `/tutor` in the meantime so they are not
locked out.

---

## 3. Hard-coded JWT secret

**Severity: critical for production.**

```python
# eduVault/services.py:52
JWT_SECRET = "eduvault-secret-key"
```

The signing key is committed to a public repository, so anyone can mint a valid
token for any user id.

**Evidence:** Source.

**Frontend impact.** None that the frontend can mitigate. No amount of
HTTP-only cookie hygiene helps while the signing key is public.

**Recommended fix.** Read `JWT_SECRET` from the environment and refuse to start
in production if it is unset. Rotate the key — every currently issued token is
compromised.

---

## 4. Tutor emails are sent to a hard-coded address

**Severity: critical for production.**

```python
# eduVault/services.py:1363
"to": "arabianprince457@gmail.com", #[tutor_email]

# eduVault/services.py:1449
"to": "arabianprince457@gmail.com",  #[tutor_email]
```

Booking and confirmation emails go to one personal address instead of the
tutor's. Tutors never learn they have a request, and one individual receives
every student's booking details.

**Evidence:** Source.

**Frontend impact.** The booking flow reports the session as `PENDING` and
tells the student the tutor must accept — which is accurate — but in practice
no tutor is notified, so requests will sit unaccepted.

**Recommended fix.** Use `tutor_email`. Add a test asserting the recipient is
the tutor's address.

---

## 5. Accept / decline links point at `127.0.0.1`

**Severity: high.**

```python
# eduVault/services.py:1597, 1603
f"http://127.0.0.1:8000/"
```

The accept and decline links embedded in tutor emails are built from a
hard-coded localhost URL, so they are unusable outside a developer's machine.
Note that `BACKEND_URL` is already read from the environment at
`services.py:40` and used correctly at `services.py:1660` — these two call
sites simply do not use it.

**Evidence:** Source.

**Frontend impact.** Sessions cannot progress past `PENDING` in production, so
`CONFIRMED` and `LIVE` are effectively unreachable. The frontend renders all
six statuses correctly regardless.

**Recommended fix.** Use the configured `BACKEND_URL` at both call sites.

---

## 6. CORS origin has a trailing slash

**Severity: medium.**

```python
# eduVault/main.py:23
allow_origins=["http://localhost:3000", "https://wassce-hub-apqu.vercel.app/"],
```

A browser `Origin` header never has a trailing slash, so the production origin
never matches.

**Evidence:** Source.

**Frontend impact.** Low, by design: this frontend makes every backend call
server-side through its own route handlers, so browser CORS is not on the path.
It would matter for any other browser client.

**Recommended fix.** Move origins to configuration (`ALLOWED_ORIGINS`) and
normalise away trailing slashes.

---

## 7. Monthly activity excludes the last day of the month

**Severity: medium — silently wrong data.**

```python
# eduVault/services.py:1006
last_day = monthrange(year, month)[1]
end_date = date(year, month, last_day)
...
# eduVault/services.py:1017
mo.QuizAttempt.created_at < end_date
```

`end_date` is midnight **on** the last day, and the filter is strictly less
than it, so every attempt made on the final day of the month is excluded from
`monthly_activity`. The day still appears in the response — with `quiz_count: 0`.

**Evidence:** Source. Not reproduced live: proving it requires submitting a
quiz on the last day of a month against the production database.

**Frontend impact.** The activity calendar will show a blank cell for the last
day of any month in which the student actually studied. The frontend cannot
detect or correct this — a zero from the backend is indistinguishable from a
real zero.

**Recommended fix.** Use an exclusive start-of-next-month bound:

```python
start_date = date(year, month, 1)
end_date = date(year + (month == 12), (month % 12) + 1, 1)
...
mo.QuizAttempt.created_at >= start_date,
mo.QuizAttempt.created_at < end_date
```

Add a regression test for an attempt created on the last day of a month.

---

## 8. Unanswered questions are counted wrong but cannot be explained

**Severity: medium — a contract dead end, not a bug.**

`submit_paper` scores against every question on the paper:

```python
# eduVault/services.py:372
total_questions = len(questions)
...
# eduVault/services.py:464
wrong=total_questions - score,
```

but `wrong_questions` is built only from answers that were actually submitted
(`services.py:388-427`). And `AnswerSubmission.selected_option_id` is a
required `int`, so an unanswered question cannot be submitted at all.

The result: a skipped question counts against the score, but produces no
`StudentAnswer` row, so `POST /ai/explain` has nothing to explain.

**Evidence:** Source, plus the deployed OpenAPI, which shows
`selected_option_id` as a required integer.

**Frontend impact.** Handled honestly rather than worked around:

- unanswered questions are **omitted** from the payload — no `null`, no
  invented option id;
- before submitting, the quiz says how many questions have no answer and that
  they will be marked wrong and cannot be AI-reviewed;
- the results screen repeats that caveat;
- the AI-review queue is built only from `wrong_questions`, so it never offers
  an explanation the backend cannot produce.

**Recommended fix.** Either accept `selected_option_id: int | None` and record
an explicit "not answered" row, or return unanswered question ids separately so
clients can distinguish "wrong" from "skipped".

---

## 9. Dashboard fields that are declared but not implemented

**Severity: medium — the schema promises more than the service delivers.**

```python
# eduVault/services.py:1080
total_duration = None
unfinished_quizzes = []
```

```python
# eduVault/services.py:993
def get_unfinished_quizzes():
    ...
```

```python
# eduVault/services.py:968
strongest_topic=None
```

So `UserDashboardResponse` advertises three capabilities the service never
populates: study duration, unfinished-quiz resume, and topic-level mastery.

**Evidence:** Source, confirmed **Live** for `total_duration_minutes` and
`unfinished_quizzes` by `npm run smoke:api` when credentials are supplied.

**Frontend impact.** Each is rendered as an explicit unavailable or empty state:

| Field | What the UI does |
| --- | --- |
| `total_duration_minutes: null` | Shows `—` and "Not tracked yet", never `0m`. `null` and `0` are rendered differently. |
| `unfinished_quizzes: []` | Empty state explaining that a quiz is only recorded once submitted. |
| `strongest_topic: null` | The topic row is omitted entirely; no topic names are invented. |

**Recommended fix.** Implement them, or drop them from the response schema so
clients do not have to guess.

---

## 10. `GET /tutors` returns subject names, but booking needs `subject_id`

**Severity: medium — forces the client to bridge the gap.**

`TutorListItem.subjects` is `list[str]`, while `BookTutoringSessionRequest`
requires `subject_id: int`. Nothing in the tutor response lets a client turn
one into the other.

**Evidence:** Live — `GET /tutors` returns
`"subjects": ["Physics", "Biology", ...]`.

**Frontend impact.** `lib/tutors/subject-matching.ts` fetches `/subjects` and
resolves each name by exact, case-insensitive match. A name with no match is
**not** guessed at: it is reported as unbookable and excluded from the booking
form, and the card says so. A tutor whose subjects all fail to resolve has
booking disabled.

**Recommended fix.** Return `"subjects": [{"id": 2, "name": "Physics"}]`.

---

## 11. `Paper.year` and `Paper.paper_number` column types are inverted

**Severity: low today, latent.**

```python
# eduVault/models.py:383
year: Mapped[int] = mapped_column(
    String(20),
    nullable=False
)

paper_number: Mapped[str] = mapped_column(
    Integer(),
    nullable=False
)
```

Each field's SQLAlchemy column type contradicts its own Python annotation, and
the migration history alters these two columns back and forth (see
`7e714d657076` and `db945f2a146c`).

**Evidence:** Source for the model; **Live** for the runtime behaviour — the
deployed API returns `"year": 2024` as a JSON number and
`"paper_number": "Paper 1"` as a JSON string, which is what clients want.

So this is not currently breaking anything, but `create_all()` against a fresh
database would build columns that cannot hold the data (`paper_number` as
`INTEGER` cannot store `"Paper 1"`).

**Frontend impact.** None in practice, but `lib/api/schemas.ts` accepts either
a number or a numeric string for `year` and either for `paper_number`, and
normalises to `number` and `string` respectively. Covered by unit tests.

**Recommended fix.** Correct the model to `year: Integer`, `paper_number:
String(20)`, then verify the live column types before writing a migration.
Check the deployed database first — do not assume the migration history
reflects it.

---

## 12. Capabilities with no endpoint at all

Not defects — simply missing. None of these are simulated in the frontend.

| Capability | Status | What the frontend does |
| --- | --- | --- |
| Teacher dashboard | No endpoint | `/tutor` lists what is unavailable |
| Teacher session list | No endpoint | Not offered |
| Tutor/student messaging | No endpoint | Removed from landing copy |
| Quiz resume / partial persistence | No endpoint | Empty state explains quizzes are recorded on submit |
| Study-duration tracking | Field always `null` | Rendered as unavailable |
| Topic-level mastery | Field always `null` | Topic rows omitted |
| WASSCE readiness score | No endpoint | Replaced by derived subject performance, labelled as such |
| Tutor online presence | No endpoint | Shows "N of M available today" from `is_available_today` |
| Tutor timeslot discovery | No endpoint | Student proposes a time; tutor accepts or declines |
| Persisted AI-review state | No endpoint | Session-scoped, in an HTTP-only cookie; documented as such |
| Question counts per subject | Not in `/subjects` | Landing page shows paper counts and year ranges instead |
| Core/elective classification | Not in `/subjects` | Not shown |
| Platform-wide user counts | No endpoint | Removed from landing copy |

---

## Summary

| # | Gap | Severity | Blocks production? |
| --- | --- | --- | --- |
| 1 | `onboard_teacher` commented out | Critical | Yes — tutor onboarding |
| 2 | `tutor` vs `teacher` role | Critical | Frontend fixed; legacy rows need a migration |
| 3 | Hard-coded JWT secret | Critical | Yes |
| 4 | Hard-coded email recipient | Critical | Yes — tutor booking |
| 5 | `127.0.0.1` accept/decline links | High | Yes — sessions cannot progress |
| 6 | CORS trailing slash | Medium | No, for this frontend |
| 7 | Month-end off-by-one | Medium | No — but shows wrong data |
| 8 | Unanswered questions unexplainable | Medium | No — documented in the UI |
| 9 | Unimplemented dashboard fields | Medium | No — rendered as unavailable |
| 10 | Tutor subjects lack ids | Medium | No — resolved by exact name match |
| 11 | Inverted `Paper` column types | Low | No — latent |
| 12 | Missing capabilities | — | Scope, not defects |

Items 3, 4 and 5 should be fixed before EduVault handles real students and
tutors. Item 1 blocks the tutor half of the product entirely.
