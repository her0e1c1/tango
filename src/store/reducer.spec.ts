import { describe, expect, it, vi } from "vitest";

import * as type from "@src/action/type";
import type { LegacyStudyFields } from "@src/features/study/state/studyStore";
import { deck } from "@src/store/reducer";
import { createDeck } from "@src/test/factories";

vi.mock("@src/action", () => ({
  deck: {
    prepare: () => ({ id: "sample-deck", category: "" }),
  },
  card: {
    prepare: (card: { uniqueKey: string }) => ({ ...card, id: card.uniqueKey }),
  },
}));

describe("deck reducer", () => {
  it("clears legacy study fields without changing the original state", () => {
    const legacyDeck = {
      ...createDeck({ id: "deck-1", name: "Legacy deck" }),
      currentIndex: 1,
      cardOrderIds: ["card-1", "card-2"],
    } satisfies Deck & LegacyStudyFields;
    const otherDeck = {
      ...createDeck({ id: "deck-2", name: "Other deck" }),
      currentIndex: 0,
      cardOrderIds: ["card-3"],
    } satisfies Deck & LegacyStudyFields;
    const state: DeckState = {
      byId: {
        [legacyDeck.id]: legacyDeck,
        [otherDeck.id]: otherDeck,
      },
      categories: [],
    };

    const result = deck(state, type.deckClearLegacyStudy(legacyDeck.id));

    expect(result.byId[legacyDeck.id]).toEqual({
      ...legacyDeck,
      currentIndex: null,
      cardOrderIds: [],
    });
    expect(result.byId[otherDeck.id]).toBe(otherDeck);
    expect(state.byId[legacyDeck.id]).toBe(legacyDeck);
  });
});
