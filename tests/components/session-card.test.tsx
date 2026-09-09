import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SessionCard } from "~/components/sessions/session-card";
import { SESSION_STATUSES } from "~/lib/api/schemas";
import { sessionFixture } from "../fixtures";

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe("session status rendering", () => {
  it("renders every status the backend can return", () => {
    for (const status of SESSION_STATUSES) {
      const { unmount } = render(<SessionCard session={sessionFixture({ status })} />);
      expect(screen.getByText("Physics")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders CANCELLED without crashing", () => {
    render(<SessionCard session={sessionFixture({ status: "CANCELLED" })} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("degrades gracefully for an unknown future status", () => {
    render(<SessionCard session={sessionFixture({ status: "RESCHEDULED" })} />);

    expect(screen.getByText("Rescheduled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join/i })).not.toBeInTheDocument();
  });

  it("renders the tutor and subject the backend supplied", () => {
    render(<SessionCard session={sessionFixture()} />);

    expect(screen.getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("Yaa Asantewaa Mensah")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
  });
});

describe("join availability", () => {
  it("offers Join only for a LIVE session", () => {
    render(
      <SessionCard
        session={sessionFixture({ status: "LIVE", meeting_url: "https://whereby.com/x" })}
      />,
    );

    expect(screen.getByRole("button", { name: /join session/i })).toBeInTheDocument();
  });

  it("offers no Join for pending, confirmed, completed, declined or cancelled", () => {
    for (const status of ["PENDING", "CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"]) {
      const { unmount } = render(
        <SessionCard
          session={sessionFixture({ status, meeting_url: "https://whereby.com/x" })}
        />,
      );

      expect(screen.queryByRole("button", { name: /join/i })).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe("protected join flow", () => {
  it("asks the server to authorise the join instead of opening meeting_url directly", async () => {
    const user = userEvent.setup();
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        session_id: 11,
        meeting_url: "https://whereby.com/authorised",
        status: "LIVE",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SessionCard
        session={sessionFixture({ status: "LIVE", meeting_url: "https://whereby.com/stale" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /join session/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/sessions/11/join");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");

    // The URL opened is the one the backend authorised, not the list's copy.
    expect(openMock).toHaveBeenCalledWith(
      "https://whereby.com/authorised",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows the backend's refusal instead of opening anything", async () => {
    const user = userEvent.setup();
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(400, { error: "Session is not live yet." })),
    );

    render(<SessionCard session={sessionFixture({ status: "LIVE" })} />);
    await user.click(screen.getByRole("button", { name: /join session/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Session is not live yet.");
    expect(openMock).not.toHaveBeenCalled();
  });

  it("refuses to open a meeting URL that is not http(s)", async () => {
    const user = userEvent.setup();
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse({ session_id: 11, meeting_url: "javascript:alert(1)", status: "LIVE" }),
      ),
    );

    render(<SessionCard session={sessionFixture({ status: "LIVE" })} />);
    await user.click(screen.getByRole("button", { name: /join session/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not open safely/i);
    expect(openMock).not.toHaveBeenCalled();
  });

  it("reports a network failure without opening a window", async () => {
    const user = userEvent.setup();
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    render(<SessionCard session={sessionFixture({ status: "LIVE" })} />);
    await user.click(screen.getByRole("button", { name: /join session/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach eduvault/i);
    expect(openMock).not.toHaveBeenCalled();
  });
});
