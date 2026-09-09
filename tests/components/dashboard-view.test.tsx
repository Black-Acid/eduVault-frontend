import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardView } from "~/components/dashboard/dashboard-view";
import type { DashboardResponse } from "~/lib/api/schemas";
import { dashboardFixture, emptyDashboardFixture, subjectsFixture } from "../fixtures";

const today = new Date("2026-09-09T10:00:00");
const yearMonth = { year: 2026, month: 9 };

function renderDashboard(dashboard: DashboardResponse = dashboardFixture) {
  return render(
    <DashboardView
      dashboard={dashboard}
      subjects={subjectsFixture}
      yearMonth={yearMonth}
      currentMonth={yearMonth}
      today={today}
    />,
  );
}

describe("dashboard overview", () => {
  it("greets the user with the name the backend returned", () => {
    renderDashboard();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome Ama");
  });

  it("renders the backend's streak", () => {
    renderDashboard();
    expect(screen.getByText("3-day streak")).toBeInTheDocument();
  });

  it("renders the backend's average score and accuracy", () => {
    renderDashboard();

    expect(screen.getByText("55%")).toBeInTheDocument(); // average_score 55.4
    expect(screen.getByText("71%")).toBeInTheDocument(); // accuracy 71.4
  });

  it("renders the backend's questions-solved count", () => {
    renderDashboard();
    expect(screen.getByText("84")).toBeInTheDocument();
  });

  it("shows none of the previously hard-coded figures", () => {
    renderDashboard();

    for (const stale of ["68%", "76%", "328", "18h 42m"]) {
      expect(screen.queryByText(stale)).not.toBeInTheDocument();
    }
  });
});

describe("study time semantics", () => {
  it("renders a null duration as unavailable, not as zero", () => {
    renderDashboard();

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/not tracked yet/i)).toBeInTheDocument();
    expect(screen.queryByText("0m")).not.toBeInTheDocument();
  });

  it("renders a real zero duration as 0m", () => {
    renderDashboard(emptyDashboardFixture);

    expect(screen.getByText("0m")).toBeInTheDocument();
    expect(screen.queryByText(/not tracked yet/i)).not.toBeInTheDocument();
  });

  it("renders a tracked duration", () => {
    renderDashboard({
      ...dashboardFixture,
      overview: { ...dashboardFixture.overview, total_duration_minutes: 1122 },
    });

    expect(screen.getByText("18h 42m")).toBeInTheDocument();
  });
});

describe("zero values", () => {
  it("renders genuine zeros rather than hiding them", () => {
    renderDashboard(emptyDashboardFixture);

    expect(screen.getByText("0-day streak")).toBeInTheDocument();
    expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("subject mastery", () => {
  it("renders the subjects the backend returned", () => {
    renderDashboard();

    expect(screen.getAllByText("Physics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chemistry").length).toBeGreaterThan(0);
  });

  it("does not render topic-level mastery when strongest_topic is null", () => {
    renderDashboard();

    expect(screen.queryByText(/strongest topic/i)).not.toBeInTheDocument();
    for (const stale of ["Algebra", "Geometry", "Statistics", "Calculus"]) {
      expect(screen.queryByText(stale)).not.toBeInTheDocument();
    }
  });

  it("renders the strongest topic when the backend does supply one", () => {
    renderDashboard({
      ...dashboardFixture,
      subject_mastery: [
        {
          subject_name: "Physics",
          mastery_percentage: 78.5,
          strongest_topic: { topic_name: "Mechanics", mastery_percentage: 91 },
        },
      ],
    });

    expect(screen.getByText(/strongest topic/i)).toBeInTheDocument();
    expect(screen.getByText("Mechanics")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
  });

  it("shows an empty state when there is no mastery data", () => {
    renderDashboard(emptyDashboardFixture);
    expect(screen.getByText(/no mastery data yet/i)).toBeInTheDocument();
  });

  it("links practice to the real subject id, not to a name-based URL", () => {
    renderDashboard();

    const links = screen.getAllByRole("link", { name: /practice subject/i });
    expect(links[0]).toHaveAttribute("href", "/student/play-quiz?subjectId=6");
  });

  it("says 'Practice subject', never 'Practice weakest topic'", () => {
    renderDashboard();
    expect(screen.queryByText(/practice weakest topic/i)).not.toBeInTheDocument();
  });

  it("falls back to the plain selector when the subject catalogue is unavailable", () => {
    render(
      <DashboardView
        dashboard={dashboardFixture}
        subjects={[]}
        yearMonth={yearMonth}
        currentMonth={yearMonth}
        today={today}
      />,
    );

    const links = screen.getAllByRole("link", { name: /practice subject/i });
    expect(links[0]).toHaveAttribute("href", "/student/play-quiz");
  });
});

describe("subject performance", () => {
  it("replaces WASSCE readiness with derived subject performance", () => {
    renderDashboard();

    expect(screen.getByText(/subject performance/i)).toBeInTheDocument();
    expect(screen.queryByText(/wassce readiness/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/estimated readiness/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/moderate/i)).not.toBeInTheDocument();
  });

  it("derives the strongest and weakest subject from real mastery values", () => {
    renderDashboard();

    expect(screen.getByText(/strongest:/i).textContent).toContain("Physics");
    expect(screen.getByText(/needs attention:/i).textContent).toContain("Chemistry");
  });
});

describe("areas to improve", () => {
  it("renders exactly what the backend returned", () => {
    renderDashboard();

    const heading = screen.getByRole("heading", { name: /areas to improve/i });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    expect(within(section!).getByText("48% mastery")).toBeInTheDocument();
  });

  it("invents no topic names or question counts", () => {
    renderDashboard();

    expect(screen.queryByText(/organic chemistry/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/18 questions answered/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/12 questions available/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing needs work", () => {
    renderDashboard(emptyDashboardFixture);
    expect(screen.getByText(/no improvement areas identified yet/i)).toBeInTheDocument();
  });
});

describe("unfinished quizzes", () => {
  it("shows an honest empty state when the backend returns none", () => {
    renderDashboard();

    expect(screen.getByText(/nothing left unfinished/i)).toBeInTheDocument();
    expect(screen.queryByText(/wassce 2024 paper 2/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/16 \/ 20 questions completed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/12 minutes ago/i)).not.toBeInTheDocument();
  });

  it("renders unfinished quizzes if the backend ever returns any", () => {
    renderDashboard({
      ...dashboardFixture,
      unfinished_quizzes: [
        {
          quiz_id: 3,
          title: "Physics 2025 Paper 1",
          total_questions: 20,
          answered_questions: 16,
          remaining_questions: 4,
          progress_percentage: 80,
          duration_spent_minutes: 22,
          last_activity_at: "2026-09-08T18:30:00Z",
        },
      ],
    });

    expect(screen.getByText("Physics 2025 Paper 1")).toBeInTheDocument();
    expect(screen.getByText("16 / 20 questions answered")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });
});

describe("monthly activity", () => {
  it("renders one cell per day of the month the backend returned", () => {
    renderDashboard();

    // September 2026 has 30 days.
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument();
  });

  it("renders the backend's counts", () => {
    renderDashboard();

    expect(screen.getByText("2026-09-02: 3 quizzes")).toBeInTheDocument();
    expect(screen.getByText("2026-09-03: 12 quizzes")).toBeInTheDocument();
  });

  it("treats days the backend did not report as zero, not as invented activity", () => {
    renderDashboard();
    expect(screen.getByText("2026-09-10: 0 quizzes")).toBeInTheDocument();
  });

  it("labels the month it is actually showing", () => {
    renderDashboard();
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("navigates months through the server, not local state", () => {
    renderDashboard();

    const previous = screen.getByRole("link", { name: /august 2026/i });
    expect(previous).toHaveAttribute("href", "/student?year=2026&month=8");
  });

  it("offers no Next link when already on the current month", () => {
    renderDashboard();
    expect(screen.queryByRole("link", { name: /october 2026/i })).not.toBeInTheDocument();
  });

  it("offers a Next link when viewing an earlier month", () => {
    render(
      <DashboardView
        dashboard={{
          ...dashboardFixture,
          monthly_activity: { year: 2026, month: 7, days: [{ date: "2026-07-04", quiz_count: 2 }] },
        }}
        subjects={subjectsFixture}
        yearMonth={{ year: 2026, month: 7 }}
        currentMonth={yearMonth}
        today={today}
      />,
    );

    expect(screen.getByRole("link", { name: /august 2026/i })).toHaveAttribute(
      "href",
      "/student?year=2026&month=8",
    );
  });
});
