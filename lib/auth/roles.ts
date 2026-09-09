/**
 * Canonical role contract.
 *
 * The backend stores and filters on `teacher` (see `AuthService.signup` and
 * `get_tutors`, which both branch on `role == "teacher"`). Signing a user up
 * with `tutor` produces a User row with no TeacherProfile, so that account can
 * never appear in tutor discovery or accept a booking.
 *
 * "Tutor" therefore lives here as a *display label only*. The value sent to and
 * received from the API is always `teacher`.
 */

export type UserRole = "student" | "teacher";

export const USER_ROLES: readonly UserRole[] = ["student", "teacher"] as const;

/** What the user sees. `teacher` is presented as "Tutor" throughout the product. */
export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  teacher: "Tutor",
};

/**
 * Legacy accounts created before the contract was fixed carry `role = "tutor"`.
 * We accept it for *routing* so those users are not locked out, but we never
 * create new ones - see docs/BACKEND_CONTRACT_GAPS.md, which describes the
 * backend migration required to give those rows a TeacherProfile.
 */
const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  tutor: "teacher",
  teachers: "teacher",
  students: "student",
};

export function normalizeRole(raw: unknown): UserRole | null {
  if (typeof raw !== "string") return null;

  const value = raw.trim().toLowerCase();
  if (!value) return null;

  if (value === "student" || value === "teacher") return value;

  return LEGACY_ROLE_ALIASES[value] ?? null;
}

/** True when the stored role is one the backend can no longer service correctly. */
export function isLegacyRoleValue(raw: unknown): boolean {
  return typeof raw === "string" && raw.trim().toLowerCase() === "tutor";
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

/** Landing route for a signed-in user. */
export function homePathForRole(role: UserRole): string {
  return role === "teacher" ? "/tutor" : "/student";
}

/** Options rendered in the signup form: user-facing label, API value. */
export const SIGNUP_ROLE_OPTIONS: ReadonlyArray<{ value: UserRole; label: string }> = [
  { value: "student", label: ROLE_LABELS.student },
  { value: "teacher", label: ROLE_LABELS.teacher },
];
