/**
 * Presentation rules for tutoring-session statuses.
 *
 * Every value in the backend's `SessionStatus` enum is covered, including
 * CANCELLED, which the previous UI omitted. A status the backend adds later
 * degrades to a neutral chip instead of crashing the page.
 */

export type SessionTone = "live" | "positive" | "pending" | "neutral" | "negative";

export type SessionStatusConfig = {
  label: string;
  tone: SessionTone;
  message: string;
  /** Only a LIVE session can be joined - the backend enforces this too. */
  canJoin: boolean;
  /** Which list the session belongs in. */
  group: "live" | "upcoming" | "past";
};

const CONFIG: Record<string, SessionStatusConfig> = {
  LIVE: {
    label: "Live now",
    tone: "live",
    message: "Your session is live. Join now to start learning.",
    canJoin: true,
    group: "live",
  },
  CONFIRMED: {
    label: "Confirmed",
    tone: "positive",
    message: "Confirmed — waiting for your tutor to start the session.",
    canJoin: false,
    group: "upcoming",
  },
  PENDING: {
    label: "Pending",
    tone: "pending",
    message: "Waiting for your tutor to accept this request.",
    canJoin: false,
    group: "upcoming",
  },
  COMPLETED: {
    label: "Completed",
    tone: "neutral",
    message: "This session has ended.",
    canJoin: false,
    group: "past",
  },
  DECLINED: {
    label: "Declined",
    tone: "negative",
    message: "Your tutor declined this request.",
    canJoin: false,
    group: "past",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "negative",
    message: "This session was cancelled.",
    canJoin: false,
    group: "past",
  },
};

/** Title-cases an unrecognised status so it is still readable. */
function humanize(status: string): string {
  const cleaned = status.trim().replace(/[_-]+/g, " ").toLowerCase();
  if (!cleaned) return "Unknown";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function sessionStatusConfig(status: string): SessionStatusConfig {
  const known = CONFIG[status.trim().toUpperCase()];
  if (known) return known;

  return {
    label: humanize(status),
    tone: "neutral",
    message: "This session has a status EduVault does not recognise yet.",
    canJoin: false,
    group: "upcoming",
  };
}

export const TONE_CLASSES: Record<SessionTone, string> = {
  live: "bg-red-100 text-red-700 border-red-200",
  positive: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  negative: "bg-slate-100 text-slate-700 border-slate-200",
};
