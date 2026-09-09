import { EmptyState, ErrorState } from "~/components/general/states";
import { TutorCard } from "~/components/tutors/tutor-card";
import { toUserMessage } from "~/lib/api/errors";
import type { Subject, Tutor } from "~/lib/api/schemas";
import { getSubjects } from "~/lib/api/subjects";
import { getTutors } from "~/lib/api/tutors";
import { availableTodayCount } from "~/lib/tutors/subject-matching";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Available tutors | EduVault",
};

/**
 * Tutor discovery, rendered entirely from `GET /tutors`.
 *
 * `/subjects` is fetched alongside it purely to map each tutor's subject names
 * onto the subject ids that `POST /sessions/book` requires.
 */
const StudentAvailableTutorsPage = async () => {
  let tutors: Tutor[];
  let subjects: Subject[];

  try {
    [tutors, subjects] = await Promise.all([getTutors(), getSubjects()]);
  } catch (error) {
    return (
      <section className="p-2">
        <ErrorState title="We could not load tutors" message={toUserMessage(error)} />
      </section>
    );
  }

  const availableToday = availableTodayCount(tutors);

  return (
    <section className="flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Available Tutors
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-mono text-3xl font-semibold text-ink">
              Book a tutor that fits your subject needs.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Browse tutors, choose one of the subjects they teach, and send a session request.
            </p>
          </div>

          {/* Derived from is_available_today. There is no presence endpoint, so
              this never claims anyone is "online now". */}
          {tutors.length > 0 ? (
            <p className="rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-medium text-blue-700">
              {availableToday} of {tutors.length} available today
            </p>
          ) : null}
        </div>
      </div>

      {tutors.length === 0 ? (
        <EmptyState
          title="No tutors are currently available"
          message="No tutors have joined EduVault yet. Please check back soon."
          actionHref="/student"
          actionLabel="Back to dashboard"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} subjects={subjects} />
          ))}
        </div>
      )}
    </section>
  );
};

export default StudentAvailableTutorsPage;
