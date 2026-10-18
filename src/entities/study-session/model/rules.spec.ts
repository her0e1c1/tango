import { calculateFsrsState } from "@/test/studyStateFixtures";
import { describe, expect, it, vi } from "vitest";
import { createCard } from "@/test/factories";

import { canMoveStudySession, resolveStudySession, selectStudyCardsWithDeadline } from "./rules";
import type { StudySession } from "./types";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
  remote: { uid: "uid", startedAt: 0 },
};

describe("study card selection [STUDY-SESSION-01] [NAVIGATION-17] [NAVIGATION-18]", () => {
  const filter = { selectedTags: ["selected"], tagAndFilter: false };
  const due = calculateFsrsState(null, "good", 0);
  const card = { ...createCard({ id: "due", tags: ["selected"] }), fsrs: due };
  it.each([true, false])("applies tags and deadlines with interval=%s", (useInterval) => {
    // Given: Prepare `cards`, `before` and any shared test state below.
    const cards = [
      card,
      { ...card, id: "future-latest", fsrs: { ...due, dueAt: due.dueAt + 30 } },
      { ...card, id: "new", fsrs: null },
      { ...card, id: "other-tag", tags: ["other"] },
      { ...card, id: "other-tag-future", tags: ["other"], fsrs: { ...due, dueAt: due.dueAt + 1 } },
      { ...card, id: "future-earliest", fsrs: { ...due, dueAt: due.dueAt + 10 } },
      { ...card, id: "future-middle", fsrs: { ...due, dueAt: due.dueAt + 20 } },
    ];
    const before = structuredClone(cards);

    // When: Exercise `selectStudyCardsWithDeadline` with the prepared inputs.
    const selected = selectStudyCardsWithDeadline(cards, filter, useInterval, due.dueAt);

    // Then: Verify the expected result in the assertions below.
    expect(selected.cards.map(({ id }) => id)).toEqual(
      useInterval ? ["due", "new"] : ["due", "future-latest", "new", "future-earliest", "future-middle"]
    );
    expect(selected.nextDueAt).toBe(useInterval ? due.dueAt + 10 : undefined);
    expect(cards).toEqual(before);
  });
  it("rejects malformed FSRS state instead of classifying it as new", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `selectStudyCardsWithDeadline` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() =>
      selectStudyCardsWithDeadline([{ ...card, fsrs: { ...due, reps: 0 } }], filter, true, due.dueAt)
    ).toThrow();
  });
});

describe("canMoveStudySession [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it("reports whether movement stays inside the Card order", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `canMoveStudySession` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(canMoveStudySession(session)).toBe(true);
    expect(canMoveStudySession({ ...session, currentIndex: 2 })).toBe(false);
  });
});

describe("resolveStudySession [STUDY-ACTIONS-03]", () => {
  const cards = [{ id: "card-1", frontText: "front" }];

  it("resolves the Card at the active session position", () => {
    // Given: Prepare `activeSession` and any shared test state below.
    const activeSession = { ...session, currentIndex: 0 };

    // When: Evaluate `resolveStudySession` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(resolveStudySession(activeSession, cards)).toEqual({
      status: "studying",
      session: activeSession,
      card: cards[0],
    });
  });

  it("waits while Cards have not loaded", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `resolveStudySession` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(resolveStudySession(session, [])).toEqual({ status: "preparing" });
  });

  it("rejects a missing session, empty position, or absent loaded Card", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `resolveStudySession` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(resolveStudySession(undefined, cards)).toEqual({ status: "invalid" });
    expect(resolveStudySession({ ...session, cardOrderIds: [] }, [])).toEqual({ status: "invalid" });
    expect(resolveStudySession(session, cards)).toEqual({ status: "invalid" });
  });
});

vi.mock("@/shared/firebase", () => ({ db: {} }));
