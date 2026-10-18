import "@/test/mockFirestorePersistence";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCard } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { setDarkMode, updatePreferences } from "@/entities/preference";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

import { useCardViewState } from "./useCardViewState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const deck = createLocalDeck({ id: "card-view-deck", category: "raw" });
const card = createLocalCard({
  id: "card-view-card",
  deckId: deck.id,
  backText: "const answer = 42;",
  tags: ["typescript"],
  uniqueKey: "card-view-card",
});

describe("CARD-VIEW-04 CARD-VIEW-05 useCardViewState", () => {
  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    updatePreferences(createPreferences({ appearance: { darkMode: true } }));
    await createDeck("user-id", deck);
    await createCard("user-id", card);
  });

  afterEach(async () => {
    await deleteDeck("user-id", deck.id);
  });

  it("shows stored Card content with its Deck category and current theme", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(() => useCardViewState(card.id));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({
      frontText: card.frontText,
      fsrs: null,
      text: "const answer = 42;",
      category: "typescript",
      code: true,
      dark: true,
    });

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      setDarkMode(false);
    });

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toMatchObject({ dark: false });
  });

  it("does not expose content for an unavailable Card", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(() => useCardViewState("missing-card"));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toBeUndefined();
  });
});
