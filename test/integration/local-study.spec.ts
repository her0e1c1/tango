import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalCard } from "@/test/factories";
import { recordLocalStudy, getCards } from "@/entities/card";
import { cardStore } from "@/entities/card/model/store";
import type { StudyAttempt } from "@/entities/study-progress";

vi.mock("@/shared/firebase", () => ({ db: {} }));

const attempt: StudyAttempt = {
  uid: "owner",
  operationId: "operation",
  sessionId: "session",
  deckId: "deck",
  cardId: "card",
  rating: "good",
  answeredAt: new Date("2026-09-20T10:00:00Z"),
  localDate: "2026-09-20",
  timeZone: "UTC",
  schemaVersion: 1,
};

describe("local study durability [SWIPE-17] [SWIPE-28]", () => {
  beforeEach(() => {
    localStorage.clear();
    cardStore.setState({
      remoteCards: [],
      localCards: [createLocalCard({ id: "card", deckId: "deck", difficulty: 5, numberOfSeen: 10 })],
      studyAttempts: [],
    });
  });
  it("saves one review and confirms it without another transition after hydration", async () => {
    expect(recordLocalStudy(attempt)).toBe("committed");
    expect(getCards()[0]).toMatchObject({ difficulty: 4, numberOfSeen: 11 });
    await cardStore.persist.rehydrate();
    expect(recordLocalStudy(attempt)).toBe("already-committed");
    expect(getCards()[0]).toMatchObject({ difficulty: 4, numberOfSeen: 11 });
    expect(() => recordLocalStudy({ ...attempt, rating: "again" })).toThrow("conflicts");
  });
  it("keeps both halves unchanged if storage rejects the combined write", () => {
    const failure = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => recordLocalStudy(attempt)).toThrow("full");
    expect(getCards()[0]).toMatchObject({ difficulty: 5, numberOfSeen: 10 });
    failure.mockRestore();
    expect(recordLocalStudy(attempt)).toBe("committed");
    expect(getCards()[0]).toMatchObject({ difficulty: 4, numberOfSeen: 11 });
  });
});
