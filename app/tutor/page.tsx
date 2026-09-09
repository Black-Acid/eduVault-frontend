import { redirect } from "next/navigation";

import Logout_Button from "~/components/general/logout-button";
import { getSession } from "~/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tutor | EduVault",
};

/**
 * Tutor workspace.
 *
 * EduVault's backend has no teacher dashboard API, no teacher-side session
 * list, and `POST /teachers/onboarding` currently calls a service function that
 * is commented out. Rather than dress that up as a working dashboard, this
 * page states exactly what a tutor can and cannot do today. See
 * docs/BACKEND_CONTRACT_GAPS.md for the endpoints this page is waiting on.
 */
const Tutor_Page = async () => {
  const session = await getSession();
  if (!session) redirect("/login?returnTo=/tutor");

  const firstName = session.name.trim().split(/\s+/)[0] || session.name;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Tutor account
        </p>
        <h1 className="font-mono text-3xl font-semibold break-words text-ink">
          Welcome {firstName}
        </h1>
        <p className="text-sm text-primary/70">
          Your tutor account is active and students can find and book you.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-primary-foreground p-5">
        <h2 className="font-mono text-xl font-semibold text-ink">How sessions reach you today</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-6 text-primary/80">
          <li>A student sends you a session request from their Available Tutors page.</li>
          <li>EduVault emails you that request with an accept link and a decline link.</li>
          <li>
            When it is time, you start the session from the link in that email and EduVault creates
            the video room.
          </li>
          <li>The student joins from their Sessions page once the session is live.</li>
        </ol>
        <p className="text-sm text-primary/70">
          Accepting, declining and starting a session all happen through those emailed links, so
          keep an eye on the inbox for the address you signed up with.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-white p-5">
        <h2 className="font-mono text-xl font-semibold text-ink">Not available in the app yet</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-primary/80">
          <li>A tutor dashboard with your upcoming and past sessions.</li>
          <li>Accepting or declining requests from inside EduVault.</li>
          <li>
            Editing your profile — bio, location, fee, subjects and specialisations — from here.
          </li>
          <li>Messaging students directly.</li>
        </ul>
        <p className="text-sm text-primary/70">
          These need backend endpoints that do not exist yet, so nothing above is simulated here.
          To change your profile details for now, contact the EduVault team.
        </p>
      </section>

      <div className="w-40">
        <Logout_Button />
      </div>
    </main>
  );
};

export default Tutor_Page;
