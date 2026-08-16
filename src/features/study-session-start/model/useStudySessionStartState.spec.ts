import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useStudySessionStartState } from "./useStudySessionStartState";

const mocks = vi.hoisted(() => ({
  cards: [] as Card[],
  cardsDeckId: undefined as string | undefined,
  deck: undefined as Deck | undefined,
  deckId: undefined as string | undefined,
  preferences: null as unknown as Preferences,
  startStudy: vi.fn(),
  tags: [] as string[],
}));

vi.mock("@/entities/card", () => ({
  useCardsByDeckId: (deckId: string) => {
    mocks.cardsDeckId = deckId;
    return { cards: mocks.cards, tags: mocks.tags };
  },
}));
vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", () => ({
  editDeck: vi.fn(),
  filterCardsForDeck: (cards: Card[]) => cards.filter(({ tags }) => tags.includes("eligible")),
  useDeck: (deckId: string) => {
    mocks.deckId = deckId;
    return mocks.deck;
  },
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
}));
vi.mock("@/entities/study-session", () => ({
  startStudy: mocks.startStudy,
}));

describe("useStudySessionStartState", () => {
  beforeEach(() => {
    mocks.cards = [];
    mocks.cardsDeckId = undefined;
    mocks.deck = createDeck({ id: "deck-id", name: "Japanese vocabulary" });
    mocks.deckId = undefined;
    mocks.preferences = createPreferences({ study: { maxNumberOfCardsToLearn: 12 } });
    mocks.startStudy.mockReset();
    mocks.tags = ["eligible", "later"];
  });

  it("starts the route Deck with its eligible Cards and Study preferences", () => {
    const eligibleCard = createCard({ id: "eligible-card", deckId: "deck-id", tags: ["eligible"] });
    mocks.cards = [eligibleCard, createCard({ id: "later-card", deckId: "deck-id", tags: ["later"] })];

    const { result } = renderHook(() => useStudySessionStartState("deck-id"));
    result.current?.onStart();

    expect(mocks.deckId).toBe("deck-id");
    expect(mocks.cardsDeckId).toBe("deck-id");
    expect(result.current).toMatchObject({
      deckName: "Japanese vocabulary",
      maxNumberOfCardsToLearn: 12,
      cardsLength: 1,
      tags: ["eligible", "later"],
    });
    expect(mocks.startStudy).toHaveBeenCalledWith("deck-id", [eligibleCard], mocks.preferences.study);
  });
});
