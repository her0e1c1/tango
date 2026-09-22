import { createEmptyCard, fsrs as createScheduler, Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { calculateFsrsState, classifyFsrsState, getStudyRetrievability } from "./rules";
import { cardStudyStateDocumentSchema } from "../api/document";
import { cardStudyStateId } from "../api/id";

const at = Date.UTC(2026, 8, 22);
describe("Card study state [STUDY-SESSION-01 STUDY-ACTIONS-01 CARD-VIEW-06]", () => {
  it("uses an unambiguous stable identity for each user and card", () => {
    expect(cardStudyStateId("a", "bc")).not.toBe(cardStudyStateId("ab", "c"));
    expect(cardStudyStateId("a:b", "c")).not.toBe(cardStudyStateId("a", "b:c"));
    expect(cardStudyStateId("a", "b")).toBe(cardStudyStateId("a", "b"));
  });
  it.each(["again", "hard", "good", "easy"] as const)(
    "saves and restores %s without changing the next calculation",
    (rating) => {
      const fsrs = calculateFsrsState(null, rating, at);
      const saved = cardStudyStateDocumentSchema.parse(
        JSON.parse(
          JSON.stringify({
            schemaVersion: 1,
            uid: "uid",
            cardId: "card",
            deckId: "deck",
            fsrs,
            createdAt: at,
            updatedAt: at,
          })
        )
      );
      expect(fsrs.reps).toBe(1);
      expect(fsrs).not.toHaveProperty("elapsedDays");
      expect(classifyFsrsState(fsrs, fsrs.dueAt).status).toBe("due");
      expect(calculateFsrsState(saved.fsrs, "good", fsrs.dueAt)).toEqual(calculateFsrsState(fsrs, "good", fsrs.dueAt));
    }
  );
  it("keeps library lapse semantics across learning, review and relearning", () => {
    const learning = calculateFsrsState(null, "again", at);
    expect(learning.state).toBe("learning");
    expect(learning.lapses).toBe(0);
    const review = calculateFsrsState(learning, "easy", learning.dueAt);
    expect(review.state).toBe("review");
    const relearning = calculateFsrsState(review, "again", review.dueAt);
    expect(relearning.state).toBe("relearning");
    expect(relearning.lapses).toBe(1);
    expect(relearning.reps).toBe(3);
    expect(getStudyRetrievability(review, review.lastReviewedAt)).toBe(1);
  });
  it("continues serialized state exactly like the pinned scheduler across rating phases", () => {
    const library = createScheduler({
      request_retention: 0.9,
      enable_fuzz: false,
      maximum_interval: 36500,
      enable_short_term: true,
      learning_steps: ["1m", "10m"],
      relearning_steps: ["10m"],
    });
    let original = createEmptyCard(new Date(at));
    let saved: ReturnType<typeof calculateFsrsState> | null = null;
    for (const [rating, grade] of [
      ["again", Rating.Again],
      ["hard", Rating.Hard],
      ["easy", Rating.Easy],
      ["again", Rating.Again],
      ["good", Rating.Good],
    ] as const) {
      const answeredAt = original.due.getTime() + 86_400_000;
      original = library.next(original, answeredAt, grade).card;
      saved = calculateFsrsState(saved, rating, answeredAt);
      expect(saved).toMatchObject({
        dueAt: original.due.getTime(),
        difficulty: original.difficulty,
        stability: original.stability,
        lastReviewedAt: original.last_review?.getTime(),
        reps: original.reps,
        lapses: original.lapses,
        scheduledDays: original.scheduled_days,
        learningSteps: original.learning_steps,
      });
      saved = JSON.parse(JSON.stringify(saved)) as typeof saved;
    }
  });
  it("classifies absence as new without fabricating difficulty", () => {
    expect(classifyFsrsState(null, at)).toEqual({ status: "new" });
  });
});
