import { redirect } from "next/navigation";

import { DashboardView } from "~/components/dashboard/dashboard-view";
import { ErrorState } from "~/components/general/states";
import { getDashboard } from "~/lib/api/dashboard";
import { isApiError, toUserMessage } from "~/lib/api/errors";
import type { Subject } from "~/lib/api/schemas";
import { getSubjects } from "~/lib/api/subjects";
import { getSession } from "~/lib/auth/session";
import { currentYearMonth, resolveYearMonth } from "~/lib/date/month";

/** User-specific data: never statically rendered or shared between users. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | EduVault",
};

type PageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function StudentDashboardPage({ searchParams }: PageProps) {
  const session = await getSession();

  // Middleware normally handles this; the guard keeps the page honest if it is
  // ever reached directly (for example from a stale prefetch).
  if (!session) redirect("/login?returnTo=/student");

  const params = await searchParams;
  const now = new Date();
  const currentMonth = currentYearMonth(now);
  const yearMonth = resolveYearMonth(params.year, params.month, now);

  let dashboard;

  try {
    dashboard = await getDashboard(session.accessToken, yearMonth.year, yearMonth.month);
  } catch (error) {
    if (isApiError(error) && error.isAuthError) {
      // The cookie exists but the backend rejected the token: treat the session
      // as invalid rather than showing a broken dashboard.
      redirect("/login?returnTo=/student");
    }

    return (
      <section className="p-2">
        <ErrorState
          title="We could not load your dashboard"
          message={toUserMessage(error)}
        />
      </section>
    );
  }

  // Subjects are only used to turn a subject name into a real subject id for the
  // "Practice subject" links. If the catalogue is unavailable the links fall
  // back to the unfiltered quiz selector - no dashboard figure depends on it.
  let subjects: Subject[] = [];
  try {
    subjects = await getSubjects();
  } catch {
    subjects = [];
  }

  return (
    <section className="p-2">
      <DashboardView
        dashboard={dashboard}
        subjects={subjects}
        yearMonth={yearMonth}
        currentMonth={currentMonth}
        today={now}
      />
    </section>
  );
}
