import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Choose_Subject from "~/components/quiz/choose-subject";
import { subjectsFixture } from "../fixtures";
import { routerMock } from "../next-mocks";

/**
 * The dependency rules themselves are covered exhaustively in
 * tests/unit/selector-state.test.ts. These cover what the component does with
 * them, and the URL it produces.
 */

describe("quiz selector", () => {
  it("renders a subject field driven by the backend catalogue", () => {
    // The listbox itself is portalled and only mounted while open; which
    // options it contains is covered by tests/unit/selector-state.test.ts.
    render(<Choose_Subject subjects={subjectsFixture} />);

    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByText(/select a subject/i)).toBeInTheDocument();
  });

  it("hides the year and paper fields until a subject is chosen", () => {
    render(<Choose_Subject subjects={subjectsFixture} />);

    expect(screen.queryByLabelText(/^year$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^paper$/i)).not.toBeInTheDocument();
  });

  it("shows the year field once a subject is pre-selected from a deep link", () => {
    render(<Choose_Subject subjects={subjectsFixture} initialSubjectId={6} />);

    expect(screen.getByLabelText(/^year$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^paper$/i)).not.toBeInTheDocument();
  });

  it("refuses to start without a complete selection, and does not navigate", async () => {
    const user = userEvent.setup();
    render(<Choose_Subject subjects={subjectsFixture} initialSubjectId={6} />);

    await user.click(screen.getByRole("button", { name: /start quiz/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/choose a subject, a year and a paper/i);
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("says so honestly when EduVault has no papers at all", () => {
    render(<Choose_Subject subjects={[]} />);

    expect(screen.getByText(/no papers available/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start quiz/i })).not.toBeInTheDocument();
  });
});
