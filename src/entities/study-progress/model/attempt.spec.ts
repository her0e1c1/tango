import { describe, expect, it } from "vitest";
import { assertSameStudyAttempt } from "./rules";
import { persistedStudyAttemptSchema, studyAttemptSchema } from "./schema";

const attempt = {
  uid: "owner",
  operationId: "operation",
  sessionId: "session",
  deckId: "deck",
  cardId: "card",
  rating: "good",
  answeredAt: new Date("2026-09-20T23:30:00Z"),
  localDate: "2026-09-21",
  timeZone: "Asia/Tokyo",
  schemaVersion: 1,
} as const;

describe("StudyAttempt contract [SWIPE-02] [SWIPE-03] [SWIPE-27] [SWIPE-28]", () => {
  it.each(["again", "hard", "good", "easy"])("records %s with the captured reporting date", (rating) => {
    expect(studyAttemptSchema.parse({ ...attempt, rating })).toMatchObject({ rating, localDate: "2026-09-21" });
  });
  it.each([
    { rating: "mastered" },
    { schemaVersion: 2 },
    { answeredAt: new Date(Number.NaN) },
    { timeZone: "Mars/Unknown" },
    { localDate: "2026-09-20" },
    { uid: "" },
    { cardId: "" },
    { operationId: "path/id" },
    { id: "duplicate" },
  ])("rejects malformed input %j", (fields) => {
    expect(studyAttemptSchema.safeParse({ ...attempt, ...fields }).success).toBe(false);
  });
  it("restores the same semantic input after JSON persistence", () => {
    const restored = persistedStudyAttemptSchema.parse(JSON.parse(JSON.stringify(attempt)));
    expect(restored).toEqual(attempt);
    expect(() => assertSameStudyAttempt(restored, attempt)).not.toThrow();
    expect(() => assertSameStudyAttempt(restored, { ...attempt, rating: "again" })).toThrow("conflicts");
  });
});
