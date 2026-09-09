import { LoadingBlock } from "~/components/general/states";

/**
 * Streamed while `GET /tutors` is in flight.
 *
 * The header matches the loaded page so nothing shifts when the data arrives.
 * The placeholder blocks carry no tutor names, ratings or fees - a skeleton
 * must not show plausible-looking business values.
 */
export default function Loading() {
  return (
    <section className="flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Available Tutors
        </p>
        <div>
          <h1 className="font-mono text-3xl font-semibold text-ink">
            Book a tutor that fits your subject needs.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Browse tutors, choose one of the subjects they teach, and send a session request.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-white/80 p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-primary/10"
              />
              <div className="flex-1">
                <LoadingBlock rows={2} label="Loading tutors" />
              </div>
            </div>
            <LoadingBlock rows={3} label="Loading tutor details" />
          </div>
        ))}
      </div>
    </section>
  );
}
