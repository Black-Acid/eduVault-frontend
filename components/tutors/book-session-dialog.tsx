"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { bookingResponseSchema, type Tutor } from "~/lib/api/schemas";
import { SESSION_DURATION_OPTIONS } from "~/lib/api/sessions";
import { formatDateTime } from "~/lib/format";
import {
  emptyBookingDraft,
  minBookingDate,
  validateBooking,
  type BookingDraft,
  type BookingErrors,
} from "~/lib/tutors/booking";
import type { BookableSubject } from "~/lib/tutors/subject-matching";

type BookSessionDialogProps = {
  tutor: Tutor;
  /** Subjects whose names resolved to a real backend subject id. */
  bookableSubjects: BookableSubject[];
  /** Subject names the tutor advertises that we could not resolve. */
  unresolvedSubjects: string[];
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success"; scheduledAt: string; status_label: string; subjectName: string };

/**
 * Requests a tutoring session.
 *
 * The backend has no timeslot API, so no availability is invented: the student
 * proposes a time and the tutor accepts or declines by email. The result is
 * reported as PENDING - never optimistically as "Confirmed".
 */
export function BookSessionDialog({
  tutor,
  bookableSubjects,
  unresolvedSubjects,
}: BookSessionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BookingDraft>(emptyBookingDraft);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const canBook = bookableSubjects.length > 0;

  const resetForm = () => {
    setDraft(emptyBookingDraft());
    setErrors({});
    setSubmitState({ status: "idle" });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submitState.status === "submitting") return;

    const validation = validateBooking(draft, { subjects: bookableSubjects });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/sessions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: tutor.id,
          subject_id: validation.subject.id,
          scheduled_at: validation.scheduledAt,
          duration_minutes: draft.durationMinutes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitState({
          status: "error",
          message:
            (data as { error?: string } | null)?.error ??
            "We could not send your request. Please try again.",
        });
        return;
      }

      const parsed = bookingResponseSchema.safeParse(data);

      if (!parsed.success) {
        setSubmitState({
          status: "error",
          message: "EduVault confirmed the booking but returned it in an unexpected format.",
        });
        return;
      }

      setSubmitState({
        status: "success",
        scheduledAt: parsed.data.scheduled_at,
        status_label: parsed.data.status,
        subjectName: validation.subject.name,
      });

      router.refresh();
    } catch {
      setSubmitState({
        status: "error",
        message: "We could not reach EduVault. Check your connection and try again.",
      });
    }
  };

  const fieldError = (field: keyof BookingDraft) =>
    errors[field] ? (
      <p id={`booking-${field}-error`} role="alert" className="text-xs text-red-600">
        {errors[field]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
            disabled={!canBook}
          />
        }
      >
        {canBook ? "Book session" : "Booking unavailable"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a session with {tutor.full_name}</DialogTitle>
          <DialogDescription>
            {tutor.full_name} has to accept your request before the session is confirmed.
          </DialogDescription>
        </DialogHeader>

        {submitState.status === "success" ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">Request sent — {submitState.status_label}</p>
              <p className="mt-1 text-sm text-amber-800">
                {submitState.subjectName} with {tutor.full_name} on{" "}
                {formatDateTime(submitState.scheduledAt)}. You will see the status change here once
                the tutor responds.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => router.push("/student/sessions")}>Go to my sessions</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`subject-${tutor.id}`} className="text-sm font-medium text-ink">
                Subject
              </label>
              <select
                id={`subject-${tutor.id}`}
                className="rounded-lg border border-blue-600/20 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                value={draft.subjectId ?? ""}
                aria-invalid={Boolean(errors.subjectId)}
                aria-describedby={errors.subjectId ? `booking-subjectId-error` : undefined}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    subjectId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              >
                <option value="">Select a subject</option>
                {bookableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {fieldError("subjectId")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`date-${tutor.id}`} className="text-sm font-medium text-ink">
                  Date
                </label>
                <input
                  id={`date-${tutor.id}`}
                  type="date"
                  min={minBookingDate()}
                  value={draft.date}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? `booking-date-error` : undefined}
                  className="rounded-lg border border-blue-600/20 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  onChange={(event) =>
                    setDraft((previous) => ({ ...previous, date: event.target.value }))
                  }
                />
                {fieldError("date")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`time-${tutor.id}`} className="text-sm font-medium text-ink">
                  Start time
                </label>
                <input
                  id={`time-${tutor.id}`}
                  type="time"
                  value={draft.time}
                  aria-invalid={Boolean(errors.time)}
                  aria-describedby={errors.time ? `booking-time-error` : undefined}
                  className="rounded-lg border border-blue-600/20 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  onChange={(event) =>
                    setDraft((previous) => ({ ...previous, time: event.target.value }))
                  }
                />
                {fieldError("time")}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`duration-${tutor.id}`} className="text-sm font-medium text-ink">
                Length
              </label>
              <select
                id={`duration-${tutor.id}`}
                className="rounded-lg border border-blue-600/20 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                value={draft.durationMinutes}
                aria-invalid={Boolean(errors.durationMinutes)}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              >
                {SESSION_DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
              {fieldError("durationMinutes")}
            </div>

            {unresolvedSubjects.length > 0 ? (
              <p className="text-xs text-primary/60">
                {unresolvedSubjects.join(", ")}{" "}
                {unresolvedSubjects.length === 1 ? "is" : "are"} not in EduVault&apos;s subject
                catalogue yet, so {unresolvedSubjects.length === 1 ? "it is" : "they are"} not
                bookable.
              </p>
            ) : null}

            {submitState.status === "error" ? (
              <p role="alert" className="text-sm text-red-600">
                {submitState.message}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitState.status === "submitting"}>
                {submitState.status === "submitting" ? "Sending request…" : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
