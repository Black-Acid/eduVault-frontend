import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ChatAiClient from "~/components/chat-ai/chat-ai-client";
import { explanationFixture } from "../fixtures";
import { routerMock } from "../next-mocks";

const pending = [
  { attempt_id: 7, question_id: 105, is_resolved: false },
  { attempt_id: 7, question_id: 108, is_resolved: false },
];

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe("AI review queue position", () => {
  it("shows the real position and length of the queue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    expect(await screen.findByText(explanationFixture.question_text)).toBeInTheDocument();
  });

  it("advances the position as questions are resolved", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending.slice(1)} totalCount={2} resolvedCount={1} />);

    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
  });

  it("never shows the old hard-coded counter", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(screen.queryByText(/Question 1 of 40/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quesion/i)).not.toBeInTheDocument();
  });
});

describe("AI explanation content", () => {
  it("requests the explanation for the current queue entry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(explanationFixture));
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat-ai");
    expect(JSON.parse(init.body)).toEqual({ attempt_id: 7, question_id: 105 });
  });

  it("renders every field the backend returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(await screen.findByText(explanationFixture.solution)).toBeInTheDocument();
    expect(screen.getByText(explanationFixture.why_student_answer_is_wrong)).toBeInTheDocument();
    expect(screen.getByText(explanationFixture.why_correct_answer_is_right)).toBeInTheDocument();
    expect(screen.getByText(explanationFixture.key_takeaway)).toBeInTheDocument();
    expect(screen.getByText(explanationFixture.topic)).toBeInTheDocument();
    expect(screen.getByText(explanationFixture.concept)).toBeInTheDocument();
  });

  it("shows the student's answer and the correct answer from the backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(await screen.findByText("B. joule")).toBeInTheDocument();
    expect(screen.getByText("C. newton")).toBeInTheDocument();
  });

  it("simulates no follow-up conversation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);
    await screen.findByText(explanationFixture.solution);

    expect(screen.queryByText(/follow-up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lorem ipsum/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ask me anything/i)).not.toBeInTheDocument();
  });

  it("shows a loading state before the explanation arrives", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/fetching ai explanation/i)).toBeInTheDocument();
  });
});

describe("AI review error handling", () => {
  it("shows the backend's error rather than an empty explanation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(502, { error: "EduVault's servers are not responding right now." })),
    );

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/not responding/i);
    expect(screen.queryByText(explanationFixture.solution)).not.toBeInTheDocument();
  });

  it("reports an off-contract response as an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ nonsense: true })));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/unexpected format/i);
  });

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach eduvault/i);
  });

  it("offers a retry that re-requests the same question", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(500, { error: "boom" }))
      .mockResolvedValueOnce(okResponse(explanationFixture));

    vi.stubGlobal("fetch", fetchMock);

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);

    await user.click(await screen.findByRole("button", { name: /try again/i }));

    expect(await screen.findByText(explanationFixture.solution)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      attempt_id: 7,
      question_id: 105,
    });
  });
});

describe("advancing the queue", () => {
  it("marks the current question resolved through the server", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse(explanationFixture))
      .mockResolvedValueOnce(okResponse({ remaining: 1 }));

    vi.stubGlobal("fetch", fetchMock);

    render(<ChatAiClient pending={pending} totalCount={2} resolvedCount={0} />);
    await screen.findByText(explanationFixture.solution);

    await user.click(screen.getByRole("button", { name: /next question/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/resolve-question");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      attempt_id: 7,
      question_id: 105,
    });
    expect(routerMock.refresh).toHaveBeenCalled();
  });

  it("labels the last entry as finishing the review", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(explanationFixture)));

    render(<ChatAiClient pending={pending.slice(1)} totalCount={2} resolvedCount={1} />);
    await screen.findByText(explanationFixture.solution);

    expect(screen.getByRole("button", { name: /finish review/i })).toBeInTheDocument();
  });
});
