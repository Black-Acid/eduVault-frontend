import { apiFetch } from "./client";
import { COLD_START_TIMEOUT_MS } from "./config";
import { authResponseSchema, type AuthResponse } from "./schemas";
import type { UserRole } from "~/lib/auth/roles";

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = LoginInput & {
  name: string;
  /** Always the canonical API value - "teacher", never "tutor". */
  role: UserRole;
};

/** `POST /auth/login` - public. */
export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    schema: authResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    body: { email: input.email, password: input.password },
  });
}

/**
 * `POST /auth/signup` - public.
 *
 * `role` must be `student` or `teacher`: the backend only creates the matching
 * StudentProfile/TeacherProfile for those two values.
 */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  return apiFetch("/auth/signup", {
    method: "POST",
    schema: authResponseSchema,
    timeoutMs: COLD_START_TIMEOUT_MS,
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    },
  });
}
