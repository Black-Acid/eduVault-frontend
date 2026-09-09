import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared loading / empty / error states.
 *
 * These deliberately contain no domain values. A skeleton shows neutral
 * placeholder bars, never a plausible-looking score or name.
 */

export function ErrorState({
  title = "We could not load this",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-8 text-center"
    >
      <h3 className="text-base font-semibold text-red-800">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-red-700">{message}</p>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-8 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm leading-6 text-primary/70">{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Neutral placeholder bars. Fixed widths, so no fabricated values and no randomness. */
export function LoadingBlock({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  const widths = ["w-3/4", "w-full", "w-2/3", "w-5/6", "w-1/2"];

  return (
    <div className="flex flex-col gap-3" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`h-4 animate-pulse rounded-full bg-primary/10 ${widths[index % widths.length]}`}
        />
      ))}
    </div>
  );
}
