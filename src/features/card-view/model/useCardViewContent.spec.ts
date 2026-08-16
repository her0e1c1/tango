import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck, createPreferences } from "@/test/factories";
import { useCardViewContent } from "./useCardViewContent";

const mocks = vi.hoisted(() => ({
  card: null as unknown as Card,
  deck: null as unknown as Deck,
  preferences: null as unknown as Preferences,
}));

vi.mock("@/entities/card", () => ({ useCard: () => mocks.card }));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/preferences", () => ({ usePreferences: () => mocks.preferences }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("useCardViewContent", () => {
  beforeEach(() => {
    mocks.card = createCard({ id: "card-id", deckId: "deck-id", backText: "const answer = 42;", tags: ["typescript"] });
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });
    mocks.preferences = createPreferences({ appearance: { darkMode: true } });
  });

  it("maps the route Entities to Card presentation content", () => {
    const { result } = renderHook(() => useCardViewContent("card-id"));

    expect(result.current).toEqual({
      text: "const answer = 42;",
      category: "typescript",
      code: true,
      dark: true,
    });
  });
});
