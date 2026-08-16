import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));

import { createCard, createDeck } from "@/test/factories";

import { useDeckListState } from "./useDeckListState";

describe("useDeckListState", () => {
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
        sessionId: "session-active-old",
        deckId: "active-old",
        cardOrderIds: ["old-1", "old-2"],
        currentIndex: 0,
        lastStudiedAt: 100,
      },
      "active-new": {
        sessionId: "session-active-new",
        deckId: "active-new",
        cardOrderIds: ["new-1", "new-2", "new-3"],
        currentIndex: 1,
        lastStudiedAt: 200,
      },
      missing: {
        sessionId: "session-missing",
        deckId: "missing",
        cardOrderIds: ["missing-card"],
        currentIndex: 0,
        lastStudiedAt: 300,
      },
    };

    const { result } = renderHook(() => useDeckListState({ decks, cards, sessionsByDeckId }));
    const { sections } = result.current;

    expect(sections.studying.map((item) => item.deck.id)).toEqual(["active-new", "active-old"]);
    expect(sections.studying[0]?.studyProgress).toEqual({
      currentIndex: 1,
      cardCount: 3,
      lastStudiedAt: 200,
    });
    expect(sections.other.map((item) => item.deck.id)).toEqual(["other-a", "other-z"]);
    expect(sections.other.map((item) => item.cardCount)).toEqual([1, 2]);
  });
});
