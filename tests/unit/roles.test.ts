import { describe, expect, it } from "vitest";

import {
  homePathForRole,
  isLegacyRoleValue,
  normalizeRole,
  roleLabel,
  SIGNUP_ROLE_OPTIONS,
} from "~/lib/auth/roles";

describe("role normalisation", () => {
  it("accepts student", () => {
    expect(normalizeRole("student")).toBe("student");
  });

  it("accepts teacher, the value the backend actually stores", () => {
    expect(normalizeRole("teacher")).toBe("teacher");
  });

  it("maps the legacy 'tutor' value to teacher for routing", () => {
    expect(normalizeRole("tutor")).toBe("teacher");
  });

  it("is case and whitespace insensitive", () => {
    expect(normalizeRole("  TEACHER ")).toBe("teacher");
    expect(normalizeRole("Student")).toBe("student");
  });

  it("returns null for an unknown role", () => {
    expect(normalizeRole("administrator")).toBeNull();
  });

  it("returns null for non-string and empty values", () => {
    expect(normalizeRole(undefined)).toBeNull();
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(42)).toBeNull();
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole("   ")).toBeNull();
  });

  it("flags legacy 'tutor' rows, which need a backend migration", () => {
    expect(isLegacyRoleValue("tutor")).toBe(true);
    expect(isLegacyRoleValue("teacher")).toBe(false);
    expect(isLegacyRoleValue("student")).toBe(false);
  });
});

describe("role presentation", () => {
  it("shows teachers as 'Tutor' to users", () => {
    expect(roleLabel("teacher")).toBe("Tutor");
    expect(roleLabel("student")).toBe("Student");
  });

  it("offers exactly the two roles the backend can provision", () => {
    expect(SIGNUP_ROLE_OPTIONS.map((option) => option.value)).toEqual(["student", "teacher"]);
  });

  it("never offers 'tutor' as an API value", () => {
    expect(SIGNUP_ROLE_OPTIONS.some((option) => String(option.value) === "tutor")).toBe(false);
  });

  it("labels the teacher option 'Tutor'", () => {
    const teacherOption = SIGNUP_ROLE_OPTIONS.find((option) => option.value === "teacher");
    expect(teacherOption?.label).toBe("Tutor");
  });
});

describe("routing by role", () => {
  it("sends students to the student dashboard", () => {
    expect(homePathForRole("student")).toBe("/student");
  });

  it("sends teachers to the tutor area", () => {
    expect(homePathForRole("teacher")).toBe("/tutor");
  });
});
