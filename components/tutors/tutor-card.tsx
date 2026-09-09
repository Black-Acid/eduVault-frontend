import { BookSessionDialog } from "./book-session-dialog";
import type { Subject, Tutor } from "~/lib/api/schemas";
import { formatCurrencyGHS, formatRating, initialsFromName, isSafeExternalUrl } from "~/lib/format";
import { matchesForTutor } from "~/lib/tutors/subject-matching";

/**
 * A tutor exactly as `GET /tutors` describes them.
 *
 * Nothing here is padded out: no invented ratings, prices, availability
 * windows or review counts. Fields the backend leaves null render a fallback
 * that says so rather than a plausible-looking value.
 */
export function TutorCard({ tutor, subjects }: { tutor: Tutor; subjects: Subject[] }) {
  const { bookable, unresolved } = matchesForTutor(tutor, subjects);
  const initials = initialsFromName(tutor.full_name);
  const hasImage = isSafeExternalUrl(tutor.profile_image);

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
            {hasImage && tutor.profile_image ? (
              // Avatar URLs are arbitrary external hosts, so next/image's
              // allowlist cannot cover them.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tutor.profile_image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold break-words text-ink">{tutor.full_name}</h2>
            <p className="text-sm text-ink-soft">
              {tutor.location ?? "Location not provided"}
            </p>
          </div>
        </div>

        {tutor.is_available_today ? (
          <span className="shrink-0 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700">
            Available today
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-ink-soft">
            Not available today
          </span>
        )}
      </div>

      {tutor.specializations.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {tutor.specializations.map((specialization) => (
            <li
              key={specialization}
              className="rounded-full border border-blue-500/15 bg-blue-500/8 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {specialization}
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-5 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
        <div className="min-w-0 rounded-xl bg-paper px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">Rating</dt>
          <dd className="mt-1 font-semibold break-words text-ink">
            {formatRating(tutor.rating, tutor.review_count)}
          </dd>
          <dd className="text-xs text-ink-soft">
            {tutor.review_count} review{tutor.review_count === 1 ? "" : "s"}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl bg-paper px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">Experience</dt>
          <dd className="mt-1 font-semibold break-words text-ink">
            {tutor.years_of_experience} year{tutor.years_of_experience === 1 ? "" : "s"}
          </dd>
          <dd className="text-xs text-ink-soft">teaching experience</dd>
        </div>
        <div className="min-w-0 rounded-xl bg-paper px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">Session fee</dt>
          <dd className="mt-1 font-semibold break-words text-ink">
            {formatCurrencyGHS(tutor.session_fee)}
          </dd>
          <dd className="text-xs text-ink-soft">per session</dd>
        </div>
      </dl>

      {tutor.bio ? (
        <p className="mt-4 text-sm leading-6 break-words text-ink-soft">{tutor.bio}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="min-w-0 text-sm text-ink-soft">
          <span className="font-semibold text-ink">Subjects:</span>{" "}
          {tutor.subjects.length > 0 ? tutor.subjects.join(", ") : "None listed"}
        </div>
        <BookSessionDialog
          tutor={tutor}
          bookableSubjects={bookable}
          unresolvedSubjects={unresolved}
        />
      </div>

      {bookable.length === 0 ? (
        <p className="mt-3 text-xs text-amber-700">
          None of this tutor&apos;s subjects match EduVault&apos;s subject catalogue, so a session
          cannot be booked yet.
        </p>
      ) : null}
    </article>
  );
}
