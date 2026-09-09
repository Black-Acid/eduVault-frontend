import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TutorCard } from "~/components/tutors/tutor-card";
import type { Tutor } from "~/lib/api/schemas";
import { subjectsFixture, tutorFixture } from "../fixtures";

function renderTutor(overrides: Partial<Tutor> = {}) {
  return render(<TutorCard tutor={{ ...tutorFixture, ...overrides }} subjects={subjectsFixture} />);
}

describe("tutor card content", () => {
  it("renders the tutor the backend returned", () => {
    renderTutor();

    expect(screen.getByRole("heading", { name: tutorFixture.full_name })).toBeInTheDocument();
    expect(screen.getByText("Kumasi, Ghana")).toBeInTheDocument();
    expect(screen.getByText(tutorFixture.bio!)).toBeInTheDocument();
  });

  it("shows none of the previously hard-coded tutors", () => {
    renderTutor();

    for (const stale of ["Ama Mensah", "Kofi Asare", "Esi Boateng", "Yaw Ofori"]) {
      expect(screen.queryByText(stale)).not.toBeInTheDocument();
    }
  });

  it("derives initials from the backend's full_name", () => {
    renderTutor();
    expect(screen.getByText("YM")).toBeInTheDocument();
  });

  it("uses the profile image when the backend supplies a usable one", () => {
    renderTutor({ profile_image: "https://example.com/tutor.jpg" });

    const image = document.querySelector("img");
    expect(image).toHaveAttribute("src", "https://example.com/tutor.jpg");
  });

  it("falls back to initials for an unusable profile image", () => {
    renderTutor({ profile_image: "javascript:alert(1)" });

    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("YM")).toBeInTheDocument();
  });

  it("says so when the location is missing rather than inventing one", () => {
    renderTutor({ location: null });
    expect(screen.getByText(/location not provided/i)).toBeInTheDocument();
  });

  it("omits the bio entirely when it is null", () => {
    renderTutor({ bio: null });
    expect(screen.queryByText(tutorFixture.bio!)).not.toBeInTheDocument();
  });
});

describe("tutor ratings, fees and experience", () => {
  it("renders the backend's rating and review count", () => {
    renderTutor();

    expect(screen.getByText("4.5 / 5.0")).toBeInTheDocument();
    expect(screen.getByText("12 reviews")).toBeInTheDocument();
  });

  it("says a tutor is unrated rather than showing 0.0 / 5.0", () => {
    renderTutor({ rating: 0, review_count: 0 });

    expect(screen.getByText(/not yet rated/i)).toBeInTheDocument();
    expect(screen.getByText("0 reviews")).toBeInTheDocument();
  });

  it("formats the session fee in cedis from the backend's value", () => {
    renderTutor();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it("shows none of the previously hard-coded prices", () => {
    renderTutor();

    for (const stale of [/GH₵120 \/ session/, /GH₵150 \/ session/, /GH₵110 \/ session/]) {
      expect(screen.queryByText(stale)).not.toBeInTheDocument();
    }
  });

  it("renders years of experience from the backend", () => {
    renderTutor();
    expect(screen.getByText("6 years")).toBeInTheDocument();
  });

  it("labels the experience and fee tiles", () => {
    // Sublabels carried over from the partner's tutors-page integration.
    renderTutor();

    expect(screen.getByText("teaching experience")).toBeInTheDocument();
    expect(screen.getByText("per session")).toBeInTheDocument();
  });
});

describe("tutor availability", () => {
  it("reports availability today when the backend says so", () => {
    renderTutor({ is_available_today: true });
    expect(screen.getByText(/available today/i)).toBeInTheDocument();
  });

  it("reports unavailability rather than inventing a window", () => {
    renderTutor({ is_available_today: false });

    expect(screen.getByText(/not available today/i)).toBeInTheDocument();
    expect(screen.queryByText(/available this evening/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/available weekends/i)).not.toBeInTheDocument();
  });

  it("never claims a tutor is online", () => {
    renderTutor();
    expect(screen.queryByText(/online now/i)).not.toBeInTheDocument();
  });
});

describe("booking availability", () => {
  it("enables booking when at least one subject resolves to a backend id", () => {
    renderTutor();
    expect(screen.getByRole("button", { name: /book session/i })).toBeEnabled();
  });

  it("disables booking when no subject can be resolved safely", () => {
    renderTutor({ subjects: ["Elective ICT"] });

    expect(screen.getByRole("button", { name: /booking unavailable/i })).toBeDisabled();
    expect(screen.getByText(/cannot be booked yet/i)).toBeInTheDocument();
  });

  it("offers only the subjects that resolved to a real subject id", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderTutor();
    await user.click(screen.getByRole("button", { name: /book session/i }));

    const select = await screen.findByLabelText(/subject/i);
    const options = Array.from(select.querySelectorAll("option")).map((option) => option.textContent);

    expect(options).toContain("Physics");
    expect(options).toContain("Chemistry");
    expect(options).not.toContain("Elective ICT");
  });

  it("explains which advertised subjects are not bookable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    renderTutor();
    await user.click(screen.getByRole("button", { name: /book session/i }));

    expect(
      await screen.findByText(/not in EduVault.s subject catalogue yet/i),
    ).toBeInTheDocument();
  });
});
