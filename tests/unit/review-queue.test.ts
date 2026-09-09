import { describe, expect, it } from "vitest";

import {
  buildReviewQueue,
  markResolved,
  parseReviewQueue,
  reviewQueueCookieOptions,
  serializeReviewQueue,
  unresolvedItems,
} from "~/lib/quiz/review-queue";
import { submitResultFixture } from "../fixtures";

describe("building the AI review queue", () => {
  it("is derived only from the backend's wrong_questions", () => {
    expect(buildReviewQueue(submitResultFixture)).toEqual([
      { attempt_id: 7, question_id: 105, is_resolved: false },
      { attempt_id: 7, question_id: 108, is_resolved: false },
    ]);
  });

  it("is empty when nothing was answered incorrectly", () => {
    expect(
      buildReviewQueue({ ...submitResultFixture, wrong: 0, wrong_questions: [] }),
    ).toEqual([]);
  });

  it("does not include unanswered questions, which the backend cannot explain", () => {
    // The backend counts unanswered questions in `wrong` but omits them from
    // `wrong_questions` because no StudentAnswer row exists for them.
    const result = { ...submitResultFixture, wrong: 4, wrong_questions: [{ question_id: 105 }] };

    expect(buildReviewQueue(result)).toHaveLength(1);
  });
});

describe("queue persistence", () => {
  it("round-trips through the cookie value", () => {
    const queue = buildReviewQueue(submitResultFixture);
    expect(parseReviewQueue(serializeReviewQueue(queue))).toEqual(queue);
  });

  it("treats a missing cookie as an empty queue", () => {
    expect(parseReviewQueue(undefined)).toEqual([]);
    expect(parseReviewQueue("")).toEqual([]);
  });

  it("rejects malformed JSON rather than throwing", () => {
    expect(parseReviewQueue("{not json")).toEqual([]);
  });

  it("rejects a payload that does not match the queue shape", () => {
    expect(parseReviewQueue(JSON.stringify([{ question_id: "abc" }]))).toEqual([]);
    expect(parseReviewQueue(JSON.stringify({ attempt_id: 1 }))).toEqual([]);
  });

  it("rejects non-positive ids", () => {
    expect(
      parseReviewQueue(
        JSON.stringify([{ attempt_id: 0, question_id: -1, is_resolved: false }]),
      ),
    ).toEqual([]);
  });

  it("writes an HTTP-only cookie so the browser cannot rewrite the queue", () => {
    const options = reviewQueueCookieOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });
});

describe("advancing through the queue", () => {
  const queue = buildReviewQueue(submitResultFixture);

  it("marks exactly one entry resolved", () => {
    const updated = markResolved(queue, 7, 105);

    expect(updated[0].is_resolved).toBe(true);
    expect(updated[1].is_resolved).toBe(false);
  });

  it("does not resolve a matching question id from a different attempt", () => {
    const updated = markResolved(queue, 999, 105);
    expect(updated.every((item) => !item.is_resolved)).toBe(true);
  });

  it("leaves the queue unchanged for an entry that is not in it", () => {
    expect(markResolved(queue, 7, 4242)).toEqual(queue);
  });

  it("lists what is still pending", () => {
    expect(unresolvedItems(markResolved(queue, 7, 105))).toHaveLength(1);
    expect(unresolvedItems(markResolved(markResolved(queue, 7, 105), 7, 108))).toHaveLength(0);
  });
});
