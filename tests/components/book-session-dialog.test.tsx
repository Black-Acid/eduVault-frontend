import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BookSessionDialog } from "~/components/tutors/book-session-dialog";
import { tutorFixture } from "../fixtures";

const bookableSubjects = [
  { id: 6, name: "Physics" },
  { id: 4, name: "Chemistry" },
];

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

const bookingResponse = {
  id: 42,
  student_id: 1,
  tutor_id: 3,
  subject_id: 6,
  scheduled_at: "2027-01-20T16:00:00Z",
  duration_minutes: 60,
  status: "PENDING",
  meeting_url: null,
  created_at: "2026-09-09T09:00:00Z",
};

function renderDialog(unresolved: string[] = []) {
  return render(
    <BookSessionDialog
      tutor={tutorFixture}
      bookableSubjects={bookableSubjects}
      unresolvedSubjects={unresolved}
    />,
  );
}

async function openAndFill(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /book session/i }));

  await user.selectOptions(await screen.findByLabelText(/subject/i), "6");
  await user.type(screen.getByLabelText(/date/i), "2027-01-20");
  await user.type(screen.getByLabelText(/start time/i), "16:00");
}

describe("booking submission", () => {
  it("sends the resolved subject id, not a subject name", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(bookingResponse));
    vi.stubGlobal("fetch", fetchMock);

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions/book");

    const body = JSON.parse(init.body);
    expect(body.tutor_id).toBe(tutorFixture.id);
    expect(body.subject_id).toBe(6);
    expect(body.duration_minutes).toBe(60);
    expect(typeof body.scheduled_at).toBe("string");
  });

  it("reports the booking as PENDING, never as confirmed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(bookingResponse)));

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByText(/request sent — PENDING/i)).toBeInTheDocument();
    // The only mention of "confirmed" is the caveat that the tutor must still
    // accept - the result itself is never presented as a confirmed session.
    expect(screen.queryByText(/^confirmed$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/session confirmed/i)).not.toBeInTheDocument();
  });

  it("tells the student the tutor must accept", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderDialog();
    await user.click(screen.getByRole("button", { name: /book session/i }));

    expect(
      await screen.findByText(/has to accept your request before the session is confirmed/i),
    ).toBeInTheDocument();
  });

  it("offers only durations the backend accepts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderDialog();
    await user.click(screen.getByRole("button", { name: /book session/i }));

    const select = await screen.findByLabelText(/length/i);
    const values = Array.from(select.querySelectorAll("option")).map((option) =>
      Number(option.value),
    );

    expect(values.every((value) => value > 0 && value <= 240)).toBe(true);
  });
});

describe("booking validation", () => {
  it("does not submit without a subject", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderDialog();
    await user.click(screen.getByRole("button", { name: /book session/i }));
    await user.type(await screen.findByLabelText(/date/i), "2027-01-20");
    await user.type(screen.getByLabelText(/start time/i), "16:00");
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/choose a subject for this session/i)).toBeInTheDocument();
  });

  it("rejects a time in the past before hitting the network", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderDialog();
    await user.click(screen.getByRole("button", { name: /book session/i }));
    await user.selectOptions(await screen.findByLabelText(/subject/i), "6");
    await user.type(screen.getByLabelText(/date/i), "2020-01-01");
    await user.type(screen.getByLabelText(/start time/i), "16:00");
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/choose a date and time in the future/i)).toBeInTheDocument();
  });

  it("marks invalid fields for assistive technology", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderDialog();
    await user.click(screen.getByRole("button", { name: /book session/i }));
    await user.click(await screen.findByRole("button", { name: /send request/i }));

    expect(screen.getByLabelText(/subject/i)).toHaveAttribute("aria-invalid", "true");
  });
});

describe("booking failures", () => {
  it("surfaces the backend's validation error", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(422, { error: "duration_minutes must be at most 240" }),
      ),
    );

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/at most 240/);
    expect(screen.queryByText(/request sent/i)).not.toBeInTheDocument();
  });

  it("surfaces a network failure without claiming success", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach eduvault/i);
    expect(screen.queryByText(/request sent/i)).not.toBeInTheDocument();
  });

  it("does not claim success when the backend returns an off-contract body", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ nope: true })));

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/unexpected format/i);
  });

  it("shows a loading state while the request is in flight", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    renderDialog();
    await openAndFill(user);
    await user.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByRole("button", { name: /sending request/i })).toBeDisabled();
  });
});
