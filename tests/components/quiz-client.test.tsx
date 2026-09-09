import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Quiz_Client from "~/components/quiz/quiz-client";
import type { Question } from "~/lib/api/schemas";
import { submitResultFixture } from "../fixtures";

const questions: Question[] = [
  {
    id: 101,
    question_number: 1,
    question: "What is the SI unit of force?",
    options: [
      { id: 201, label: "A", text: "joule" },
      { id: 202, label: "B", text: "newton" },
    ],
  },
  {
    id: 102,
    question_number: 2,
    question: "What is the SI unit of power?",
    options: [
      { id: 203, label: "A", text: "watt" },
      { id: 204, label: "B", text: "pascal" },
    ],
  },
];

function renderQuiz() {
  return render(
    <Quiz_Client
      questions={questions}
      paperId={7}
      subjectName="Physics"
      year={2020}
      paperNumber="Paper 1"
    />,
  );
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe("quiz submission", () => {
  it("submits the selected answers against the exact paper id", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(submitResultFixture));
    vi.stubGlobal("fetch", fetchMock);

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/submit-quiz");
    expect(JSON.parse(init.body)).toEqual({
      paper_id: 7,
      answers: [
        { question_id: 101, selected_option_id: 202 },
        { question_id: 102, selected_option_id: 203 },
      ],
    });
  });

  it("omits unanswered questions instead of sending null or a made-up option id", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(submitResultFixture));
    vi.stubGlobal("fetch", fetchMock);

    renderQuiz();

    // Answer only the first question, then skip to the end.
    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    for (const answer of body.answers) {
      expect(typeof answer.selected_option_id).toBe("number");
      expect(answer.selected_option_id).toBeGreaterThan(0);
    }
  });

  it("warns before submitting with unanswered questions", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));

    expect(screen.getByText(/1 of 2 questions have no answer/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be reviewed with ai/i)).toBeInTheDocument();
  });

  it("requires an answer before advancing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderQuiz();
    await user.click(screen.getByRole("button", { name: /next question/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/select an answer/i);
    expect(
      screen.getByRole("heading", { name: /what is the si unit of force/i }),
    ).toBeInTheDocument();
  });
});

describe("quiz results", () => {
  it("renders the backend's own result values", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(submitResultFixture)));

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(await screen.findByText(/quiz submitted/i)).toBeInTheDocument();
    expect(screen.getByText("60.00%")).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
  });

  it("offers AI review sized to the backend's wrong_questions", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(submitResultFixture)));

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(
      await screen.findByRole("button", { name: /review 2 missed questions with ai/i }),
    ).toBeEnabled();
  });

  it("disables AI review when nothing is reviewable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse({ ...submitResultFixture, wrong: 0, wrong_questions: [] }),
      ),
    );

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(await screen.findByRole("button", { name: /nothing to review with ai/i })).toBeDisabled();
  });
});

describe("quiz submission failures", () => {
  it("does not show a results screen when the backend rejects the submission", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(401, { error: "Your session has expired." })),
    );

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(await screen.findByText(/could not submit your quiz/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired.");
    expect(screen.queryByText(/quiz submitted/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/60\.00%/)).not.toBeInTheDocument();
  });

  it("does not show results when the backend returns an off-contract body", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ unexpected: true })));

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(await screen.findByText(/could not submit your quiz/i)).toBeInTheDocument();
  });

  it("shows an error, not results, when the network fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach eduvault/i);
  });

  it("lets the student retry a failed submission without losing answers", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(503, { error: "Service unavailable" }))
      .mockResolvedValueOnce(okResponse(submitResultFixture));

    vi.stubGlobal("fetch", fetchMock);

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));
    await user.click(screen.getByRole("button", { name: /submit quiz/i }));

    await user.click(await screen.findByRole("button", { name: /try submitting again/i }));

    expect(await screen.findByText(/quiz submitted/i)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).answers).toHaveLength(2);
  });

  it("does not submit twice when the button is double-clicked", async () => {
    const user = userEvent.setup();
    let resolveFetch: ((value: unknown) => void) | undefined;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    renderQuiz();

    await user.click(screen.getByRole("radio", { name: /newton/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("radio", { name: /watt/i }));

    const submit = screen.getByRole("button", { name: /submit quiz/i });
    await user.click(submit);
    await user.click(submit).catch(() => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: /submitting/i })).toBeDisabled();

    resolveFetch?.(okResponse(submitResultFixture));
  });
});

describe("quiz context", () => {
  it("names the exact paper being attempted", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderQuiz();

    expect(screen.getByText(/Physics · 2020 · Paper 1/)).toBeInTheDocument();
  });

  it("counts questions from the real question list", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderQuiz();

    expect(screen.getByText(/of 2/)).toBeInTheDocument();
  });
});
