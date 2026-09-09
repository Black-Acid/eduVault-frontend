import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "~/app/login/login-form";
import { SignupForm } from "~/app/signup/signup-form";
import { navigationState, routerMock } from "../next-mocks";

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe("login form", () => {
  it("posts to the BFF, never to the backend directly", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(fetchMock.mock.calls[0][0]).toBe("/api/login");
    expect(String(fetchMock.mock.calls[0][0])).not.toMatch(/onrender\.com/);
  });

  it("follows the server's role-appropriate redirect for a student", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" })),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/student"));
  });

  it("follows the server's redirect to the tutor area for a teacher", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ name: "Yaa", role: "teacher", redirectTo: "/tutor" })),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "yaa@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/tutor"));
  });

  it("returns the user to where an expired session interrupted them", async () => {
    const user = userEvent.setup();
    navigationState.searchParams = new URLSearchParams("returnTo=/student/sessions");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" })),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/student/sessions"));
  });

  it("ignores an off-site returnTo, so it cannot become an open redirect", async () => {
    const user = userEvent.setup();
    navigationState.searchParams = new URLSearchParams("returnTo=//evil.example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" })),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/student"));
  });

  it("shows the backend's own error detail", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(401, { error: "Invalid email or password." })),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("reports a network failure", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach eduvault/i);
  });

  it("validates the email locally before calling the API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("signup form", () => {
  async function fillSignup(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/full name/i), "Ama Serwaa");
    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
  }

  it("sends the canonical role value the backend understands", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    await fillSignup(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.role).toBe("student");
    // A "tutor" role would create a User with no TeacherProfile.
    expect(body.role).not.toBe("tutor");
  });

  it("shows 'Tutor' as the label for the teacher role", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
  });

  it("enforces the backend's minimum password length locally", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/full name/i), "Ama Serwaa");
    await user.type(screen.getByLabelText(/email/i), "ama@example.com");
    await user.type(screen.getByLabelText(/password/i), "123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the backend's error rather than a generic one", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(400, { error: "Email already registered." })),
    );

    render(<SignupForm />);
    await fillSignup(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered.");
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("follows the server's redirect after a successful signup", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ name: "Ama", role: "student", redirectTo: "/student" })),
    );

    render(<SignupForm />);
    await fillSignup(user);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/student"));
  });
});
