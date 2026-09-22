import { describe, expect, it, vi } from "vitest";
import type { StudySession } from "@/entities/study-session";
import { planStudySessionSwipe } from "./planStudySessionSwipe";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
  remote: { uid: "uid", startedAt: 0 },
};

describe("planStudySessionSwipe [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  const cards = [
    { id: "card-1", difficulty: 5, numberOfSeen: 0 },
    { id: "card-2", difficulty: 2, numberOfSeen: 3 },
  ];

  it.each([
    ["GoToNextCard", undefined],
    ["RateGood", "good"],
    ["RateAgain", "again"],
    ["RateHard", "hard"],
    ["RateEasy", "easy"],
  ] as const)("plans %s with rating %s", (swipeAction, rating) => {
    expect(planStudySessionSwipe(session, cards, swipeAction)).toEqual({ effect: "next", rating });
  });

  it.each([
    ["DoNothing", "none"],
    ["GoBack", "exit"],
  ] as const)("plans %s as %s without a progress edit", (swipeAction, effect) => {
    expect(planStudySessionSwipe(session, cards, swipeAction)).toEqual({ effect });
  });

  it("ignores swipes without a resolvable active session", () => {
    expect(planStudySessionSwipe(undefined, cards, "GoToNextCard")).toEqual({ effect: "none" });
    expect(planStudySessionSwipe(session, cards.slice(0, 1), "GoToNextCard")).toEqual({ effect: "none" });
    expect(planStudySessionSwipe({ ...session, currentIndex: 3 }, cards, "GoToNextCard")).toEqual({
      effect: "none",
    });
  });
});

vi.mock("@/shared/firebase", () => ({ db: {} }));
