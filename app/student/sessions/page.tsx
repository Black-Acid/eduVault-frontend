import { redirect } from "next/navigation";

import { EmptyState, ErrorState } from "~/components/general/states";
import { SessionCard } from "~/components/sessions/session-card";
import { isApiError, toUserMessage } from "~/lib/api/errors";
import type { StudentSession } from "~/lib/api/schemas";
import { getMySessions } from "~/lib/api/sessions";
import { getSession } from "~/lib/auth/session";
import { sessionStatusConfig } from "~/lib/sessions/status";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutoring sessions | EduVault",
};

function groupSessions(sessions: StudentSession[]) {
  const live: StudentSession[] = [];
  const upcoming: StudentSession[] = [];
  const past: StudentSession[] = [];

  for (const session of sessions) {
    const group = sessionStatusConfig(session.status).group;
    if (group === "live") live.push(session);
    else if (group === "upcoming") upcoming.push(session);
    else past.push(session);
  }

  return { live, upcoming, past };
}

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login?returnTo=/student/sessions");

  let sessions: StudentSession[];

  try {
    sessions = await getMySessions(session.accessToken);
  } catch (error) {
    if (isApiError(error) && error.isAuthError) {
      redirect("/login?returnTo=/student/sessions");
    }

    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <ErrorState
          title="We could not load your sessions"
          message={toUserMessage(error)}
        />
      </div>
    );
  }

  const { live, upcoming, past } = groupSessions(sessions);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tutoring sessions</h1>
        <p className="mt-2 text-lg text-slate-500">
          Every session you have requested, and where each one stands.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="You do not have any tutoring sessions yet"
          message="Find a tutor, pick one of their subjects and send a session request."
          actionHref="/student/available-tutors"
          actionLabel="Browse tutors"
        />
      ) : (
        <div className="space-y-10">
          {live.length > 0 ? (
            <section>
              <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-800">
                <span aria-hidden="true" className="relative mr-3 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
                Live now
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {live.map((item) => (
                  <SessionCard key={item.id} session={item} />
                ))}
              </div>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Upcoming sessions</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {upcoming.map((item) => (
                  <SessionCard key={item.id} session={item} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-800">
                Past, declined and cancelled
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {past.map((item) => (
                  <SessionCard key={item.id} session={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
