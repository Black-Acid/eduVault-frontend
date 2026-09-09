import { describe, expect, it } from "vitest";

import { SESSION_STATUSES } from "~/lib/api/schemas";
import { sessionStatusConfig, TONE_CLASSES } from "~/lib/sessions/status";

describe("session status rendering", () => {
  it("covers every status in the backend enum", () => {
    for (const status of SESSION_STATUSES) {
      const config = sessionStatusConfig(status);

      expect(config.label).toBeTruthy();
      expect(config.message).toBeTruthy();
      expect(TONE_CLASSES[config.tone]).toBeTruthy();
    }
  });

  it("renders CANCELLED, which the previous UI omitted", () => {
    const config = sessionStatusConfig("CANCELLED");

    expect(config.label).toBe("Cancelled");
    expect(config.canJoin).toBe(false);
    expect(config.group).toBe("past");
  });

  it("allows joining only a LIVE session", () => {
    expect(sessionStatusConfig("LIVE").canJoin).toBe(true);

    for (const status of ["PENDING", "CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"]) {
      expect(sessionStatusConfig(status).canJoin).toBe(false);
    }
  });

  it("groups statuses for the three lists", () => {
    expect(sessionStatusConfig("LIVE").group).toBe("live");
    expect(sessionStatusConfig("PENDING").group).toBe("upcoming");
    expect(sessionStatusConfig("CONFIRMED").group).toBe("upcoming");
    expect(sessionStatusConfig("COMPLETED").group).toBe("past");
    expect(sessionStatusConfig("DECLINED").group).toBe("past");
  });

  it("does not claim a booking is confirmed while it is pending", () => {
    expect(sessionStatusConfig("PENDING").label).not.toMatch(/confirmed/i);
    expect(sessionStatusConfig("PENDING").message).toMatch(/accept/i);
  });

  it("degrades gracefully for an unknown future status", () => {
    const config = sessionStatusConfig("RESCHEDULED");

    expect(config.label).toBe("Rescheduled");
    expect(config.canJoin).toBe(false);
    expect(TONE_CLASSES[config.tone]).toBeTruthy();
  });

  it("humanises an underscored status", () => {
    expect(sessionStatusConfig("AWAITING_PAYMENT").label).toBe("Awaiting payment");
  });

  it("is case and whitespace insensitive", () => {
    expect(sessionStatusConfig(" live ").canJoin).toBe(true);
    expect(sessionStatusConfig("Pending").label).toBe("Pending");
  });

  it("does not throw on an empty status", () => {
    expect(() => sessionStatusConfig("")).not.toThrow();
    expect(sessionStatusConfig("").label).toBe("Unknown");
  });
});
