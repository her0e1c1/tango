import { describe, expect, it, vi } from "vitest";

import type { StudySession } from "@/entities/study-session";
import { calculateStudySchedule } from "@/entities/study-schedule";
import { createCard, createDeck } from "@/test/factories";

import { buildDeckListSections } from "./buildDeckListSections";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const now = Date.UTC(2026, 0, 1);

describe("DECK-NAVIGATION-12 DECK-NAVIGATION-13 Deck review sections", () => {
  it("counts filtered candidates before session limits and keeps active Decks in Studying", () => {
    const decks = [
      createDeck({ id: "new", name: "Alpha new" }),
      createDeck({ id: "review", name: "Zulu review", difficultyMin: 3, difficultyMax: 5, selectedTags: ["target"] }),
      createDeck({ id: "future", name: "Future" }),
      createDeck({ id: "filtered", name: "Filtered", selectedTags: ["missing"] }),
      createDeck({ id: "empty", name: "Empty" }),
      createDeck({ id: "active", name: "Active" }),
    ];
    const cards = [
      createCard({ id: "new", deckId: "new" }),
      createCard({ id: "due-1", deckId: "review", tags: ["target"], difficulty: 3, nextSeeingAt: new Date(now - 2) }),
      createCard({ id: "due-2", deckId: "review", tags: ["target"], difficulty: 5, nextSeeingAt: new Date(now) }),
      createCard({ id: "new-review", deckId: "review", tags: ["target"] }),
      createCard({ id: "hidden-tag", deckId: "review", nextSeeingAt: new Date(now - 10) }),
      createCard({ id: "hidden-difficulty", deckId: "review", tags: ["target"], difficulty: 2 }),
      createCard({ id: "future", deckId: "future", nextSeeingAt: new Date(now + 1000) }),
      createCard({ id: "filtered", deckId: "filtered", nextSeeingAt: new Date(now + 100) }),
      createCard({ id: "active", deckId: "active" }),
    ];
    const session: StudySession = {
      sessionId: "session-active",
      deckId: "active",
      cardOrderIds: ["active"],
      currentIndex: 0,
      lastStudiedAt: now,
      remote: { uid: "user-id", startedAt: now },
    };
    const sessions = { active: session };
    const before = structuredClone({ cards, decks, sessions });
    const result = buildDeckListSections(decks, cards, sessions, true, now);

    expect(result.reviewSummary).toEqual({ dueCardCount: 2, newCardCount: 3 });
    expect(result.reviewNow.map(({ deck }) => deck.id)).toEqual(["review", "new"]);
    expect(result.reviewNow[0]).toMatchObject({ cardCount: 5, review: { dueCardCount: 2, newCardCount: 1 } });
    expect(result.studying).toHaveLength(1);
    expect(result.studying[0]?.studySession).toBe(session);
    expect(result.other.map(({ deck }) => deck.id)).toEqual(["empty", "filtered", "future"]);
    expect(result.nextDueAt).toBe(now + 1000);
    expect(result.other[0]).toMatchObject({ cardCount: 0 });
    expect(result.other[1]?.review?.nextDueAt).toBeUndefined();
    expect(result.other[2]?.review?.nextDueAt).toBe(now + 1000);
    expect({ cards, decks, sessions }).toEqual(before);
  });

  it("sorts due Decks by deadline and breaks equal deadlines and new-only ties by name", () => {
    const decks = ["Zulu", "Beta", "Alpha", "New Z", "New A"].map((name) => createDeck({ id: name, name }));
    const cards = decks.map(({ id }, index) =>
      createCard({ id, deckId: id, ...(index < 3 ? { nextSeeingAt: new Date(now - (index === 0 ? 2 : 1)) } : {}) })
    );
    expect(buildDeckListSections(decks, cards, {}, true, now).reviewNow.map(({ deck }) => deck.name)).toEqual([
      "Zulu",
      "Alpha",
      "Beta",
      "New A",
      "New Z",
    ]);
  });

  it.each([false, true])("uses saved tag matching (AND: %s) instead of redefining filters", (tagAndFilter) => {
    const deck = createDeck({ selectedTags: ["a", "b"], tagAndFilter });
    const cards = [createCard({ id: "one", tags: ["a"] }), createCard({ id: "both", tags: ["a", "b"] })];
    expect(buildDeckListSections([deck], cards, {}, true, now).reviewSummary?.newCardCount).toBe(tagAndFilter ? 1 : 2);
  });

  it("uses the FSRS schedule instead of an expired legacy deadline", () => {
    const schedule = { ...calculateStudySchedule(undefined, "good", now), dueAt: now + 1000 };
    const card = createCard({ schedule, nextSeeingAt: new Date(now - 1000), numberOfSeen: 5 });
    const before = buildDeckListSections([createDeck()], [card], {}, true, now);
    expect(before.reviewSummary).toEqual({ dueCardCount: 0, newCardCount: 0 });
    expect(before.nextDueAt).toBe(schedule.dueAt);
    const at = buildDeckListSections([createDeck()], [card], {}, true, schedule.dueAt);
    expect(at.reviewSummary).toEqual({ dueCardCount: 1, newCardCount: 0 });
    expect(at.nextDueAt).toBeUndefined();
  });

  it("does not reinterpret malformed timing as a new Card or an empty result", () => {
    const card = createCard({ nextSeeingAt: new Date(Number.NaN) });
    expect(() => buildDeckListSections([createDeck()], [card], {}, true, now)).toThrow();
  });

  it("keeps a zero-due active Session and the original ordering when scheduling is disabled", () => {
    const active = createDeck({ id: "active", name: "Active" });
    const decks = [createDeck({ id: "z", name: "Zulu" }), active, createDeck({ id: "a", name: "Alpha" })];
    const sessions = {
      active: {
        sessionId: "active-session",
        deckId: "active",
        cardOrderIds: ["card"],
        currentIndex: 0,
        lastStudiedAt: now,
        remote: { uid: "user-id", startedAt: now },
      },
    };
    const cards = [createCard({ id: "card", deckId: "active", nextSeeingAt: new Date(now + 1000) })];
    expect(buildDeckListSections(decks, cards, sessions, true, now).studying[0]?.review).toMatchObject({
      dueCardCount: 0,
      newCardCount: 0,
    });
    const result = buildDeckListSections(decks, cards, sessions, false, now);
    expect(result.studying[0]?.studySession).toEqual(sessions.active);
    expect(result.other.map(({ deck }) => deck.id)).toEqual(["a", "z"]);
    expect(result.reviewNow).toEqual([]);
    expect(result.reviewSummary).toBeUndefined();
    expect(result.nextDueAt).toBeUndefined();
  });
});
