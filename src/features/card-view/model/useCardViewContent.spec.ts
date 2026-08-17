import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { setDarkMode, updatePreferences } from "@/entities/preferences";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { useCardViewContent } from "./useCardViewContent";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const deck = createLocalDeck({ id: "card-view-deck", category: "raw" });
const card = createLocalCard({
  id: "card-view-card",
  deckId: deck.id,
  backText: "const answer = 42;",
  tags: ["typescript"],
  uniqueKey: "card-view-card",
});

describe("useCardViewContent", () => {
  beforeEach(async () => {
    updatePreferences(createPreferences({ appearance: { darkMode: true } }));
    await createDeck("", deck);
    await mutateCards("", [{ kind: "create", card }]);
  });

  afterEach(async () => {
    await deleteDeck("", deck);
  });

  it("shows stored Card content with its Deck category and current theme", () => {
    const { result } = renderHook(() => useCardViewContent(card.id));

    expect(result.current).toEqual({
      text: "const answer = 42;",
      category: "typescript",
      code: true,
      dark: true,
    });

    act(() => {
      setDarkMode(false);
    });

    expect(result.current).toMatchObject({ dark: false });
  });

  it("does not expose content for an unavailable Card", () => {
    const { result } = renderHook(() => useCardViewContent("missing-card"));

    expect(result.current).toBeUndefined();
  });
});
