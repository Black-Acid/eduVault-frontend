"use client";

import { useState } from "react";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { StudentSession } from "~/lib/api/schemas";
import { formatDate, formatTime, isSafeExternalUrl } from "~/lib/format";
import { sessionStatusConfig, TONE_CLASSES } from "~/lib/sessions/status";

/**
 * One tutoring session.
 *
 * Joining always goes through `POST /api/sessions/{id}/join`, which asks the
 * backend to re-verify ownership and LIVE status before returning a meeting
 * URL. The `meeting_url` present on the list response is never opened directly.
 */
export function SessionCard({ session }: { session: StudentSession }) {
  const config = sessionStatusConfig(session.status);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (isJoining) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch(`/api/sessions/${session.id}/join`, { method: "POST" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setJoinError(
          (data as { error?: string } | null)?.error ??
            "We could not open this session. Please try again.",
        );
        return;
      }

      const meetingUrl = (data as { meeting_url?: string } | null)?.meeting_url;

      if (!isSafeExternalUrl(meetingUrl)) {
        setJoinError("EduVault returned a meeting link we could not open safely.");
        return;
      }

      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    } catch {
      setJoinError("We could not reach EduVault. Check your connection and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        config.canJoin ? "border-red-300 shadow-md ring-1 ring-red-100" : "hover:shadow-sm"
      }`}
    >
      {config.canJoin ? (
        <div aria-hidden="true" className="absolute left-0 top-0 h-full w-1 bg-red-500" />
      ) : null}

      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-xl font-bold tracking-tight break-words">
              {session.subject.name}
            </CardTitle>
            <CardDescription className="mt-1.5 text-base break-words text-muted-foreground">
              {session.tutor.name}
            </CardDescription>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[config.tone]}`}
          >
            {config.label}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-3">
          <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Date</dt>
              <dd>{formatDate(session.scheduled_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Time</dt>
              <dd>{formatTime(session.scheduled_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Length</dt>
              <dd>{session.duration_minutes} min</dd>
            </div>
          </dl>

          <p className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm italic text-slate-500">
            {config.message}
          </p>

          {joinError ? (
            <p role="alert" className="text-sm text-red-600">
              {joinError}
            </p>
          ) : null}
        </div>
      </CardContent>

      {config.canJoin ? (
        <CardFooter className="bg-red-50/30 pt-2">
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full bg-red-600 font-medium text-white shadow-sm transition-colors hover:bg-red-700"
          >
            {isJoining ? "Opening session…" : "Join session"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
