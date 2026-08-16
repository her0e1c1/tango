import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useCardViewState } from "./useCardViewState";

const mocks = vi.hoisted(() => ({
  card: undefined as Card | undefined,
  cardId: undefined as string | undefined,
  deck: undefined as Deck | undefined,
  deckId: undefined as string | undefined,
  preferences: null as unknown as Preferences,
}));

vi.mock("@/entities/card", () => ({
  useCard: (cardId: string) => {
    mocks.cardId = cardId;
    return mocks.card;
  },
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: (deckId: string | undefined) => {
    mocks.deckId = deckId;
    return mocks.deck;
  },
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("useCardViewState", () => {
  beforeEach(() => {
    mocks.card = undefined;
    mocks.cardId = undefined;
    mocks.deck = undefined;
    mocks.deckId = undefined;
    mocks.preferences = createPreferences({ appearance: { darkMode: true } });
  });

  it("reports unavailable content while the Card is missing", () => {
    const { result } = renderHook(() => useCardViewState("card-id"));

    expect(mocks.cardId).toBe("card-id");
    expect(mocks.deckId).toBeUndefined();
    expect(result.current).toEqual({ available: false, content: undefined });
  });

  it("reports unavailable content while the Card's Deck is missing", () => {
    mocks.card = createCard({ id: "card-id", deckId: "deck-id" });

    const { result } = renderHook(() => useCardViewState("card-id"));

    expect(mocks.deckId).toBe("deck-id");
    expect(result.current).toEqual({ available: false, content: undefined });
  });

  it("maps available Entity state to Card presentation content", () => {
    mocks.card = createCard({ id: "card-id", deckId: "deck-id", backText: "const answer = 42;", tags: ["typescript"] });
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });

    const { result } = renderHook(() => useCardViewState("card-id"));

    expect(result.current).toEqual({
      available: true,
      content: {
        text: "const answer = 42;",
        category: "typescript",
        code: true,
        dark: true,
      },
    });
  });
});
