import type { DeckId } from "@/entities/deck";

import { describe, expect, it } from "vitest";

import { createCard, createDeck } from "@/test/factories";

import { buildDeckListSections } from "./buildDeckListSections";

describe("buildDeckListSections", () => {
  it("puts active decks in recent order and inactive decks in name order", () => {
    const decks = [
      createDeck({ id: "other-z", name: "Zulu" }),
      createDeck({ id: "active-old", name: "Bravo" }),
      createDeck({ id: "other-a", name: "Alpha" }),
      createDeck({ id: "active-new", name: "Charlie" }),
    ];
    const cards = [
      createCard({ id: "card-1", deckId: "other-z" }),
      createCard({ id: "card-2", deckId: "other-z" }),
      createCard({ id: "card-3", deckId: "other-a" }),
    ];
    const sessionsByDeckId = {
      "active-old": {
        status: "studying" as const,
        deckId: "active-old",
        cardOrderIds: ["old-1", "old-2"],
        currentIndex: 0,
        lastStudiedAt: 100,
      },
      "active-new": {
        status: "studying" as const,
        deckId: "active-new",
        cardOrderIds: ["new-1", "new-2", "new-3"],
        currentIndex: 1,
        lastStudiedAt: 200,
      },
      missing: {
        status: "studying" as const,
        deckId: "missing",
        cardOrderIds: ["missing-card"],
        currentIndex: 0,
        lastStudiedAt: 300,
      },
    };

    const sections = buildDeckListSections(decks, cards, sessionsByDeckId);

    expect(sections.studying.map((item) => item.deck.id)).toEqual(["active-new", "active-old"]);
    expect(sections.studying[0]?.studyProgress).toEqual({
      currentIndex: 1,
      cardCount: 3,
      lastStudiedAt: 200,
    });
    expect(sections.other.map((item) => item.deck.id)).toEqual(["other-a", "other-z"]);
    expect(sections.other.map((item) => item.cardCount)).toEqual([1, 2]);
  });

  it("uses deck name as a stable tie breaker for equally recent sessions", () => {
    const decks = [createDeck({ id: "b", name: "Beta" }), createDeck({ id: "a", name: "Alpha" })];
    const session = (deckId: DeckId) => ({
      status: "studying" as const,
      deckId,
      cardOrderIds: [`${deckId}-card`],
      currentIndex: 0,
      lastStudiedAt: 100,
    });

    const sections = buildDeckListSections(decks, [], { a: session("a"), b: session("b") });

    expect(sections.studying.map((item) => item.deck.name)).toEqual(["Alpha", "Beta"]);
    expect(sections.other).toEqual([]);
  });

  it("does not present completed sessions as in-progress study", () => {
    const deck = createDeck({ id: "completed", name: "Completed" });
    const sections = buildDeckListSections([deck], [], {
      completed: {
        status: "completed",
        cardOrderIds: ["card-1"],
        currentIndex: 0,
        lastStudiedAt: 100,
      },
    });

    expect(sections.studying).toEqual([]);
    expect(sections.other).toEqual([{ deck, cardCount: 0 }]);
  });
});
