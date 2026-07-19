import { describe, expect, it } from "vitest";

import { cardsForDeck, filteredCardsForDeck, remoteValues, tagsForDeck } from "@/query/selectors";
import { createCard, createConfig, createDeck } from "@/test/factories";

describe("remote collection selectors", () => {
  it("omits undefined collection entries", () => {
    const card = createCard({ id: "first" });

    expect(remoteValues({ first: card, missing: undefined })).toEqual([card]);
  });

  it("selects Cards and sorted unique tags for one Deck", () => {
    const first = createCard({ id: "first", deckId: "deck-a", tags: ["z", "a"] });
    const second = createCard({ id: "second", deckId: "deck-a", tags: ["a"] });
    const other = createCard({ id: "other", deckId: "deck-b", tags: ["other"] });
    const cards = [first, second, other];

    expect(cardsForDeck(cards, "deck-a")).toEqual([first, second]);
    expect(tagsForDeck(cards, "deck-a")).toEqual(["a", "z"]);
  });

  it("filters Deck Cards using the supplied time", () => {
    const now = Date.UTC(2026, 6, 19);
    const deck = createDeck({ id: "deck-a" });
    const available = createCard({ id: "available", deckId: deck.id, nextSeeingAt: new Date(now) });
    const future = createCard({ id: "future", deckId: deck.id, nextSeeingAt: new Date(now + 1) });
    const config = createConfig({ useCardInterval: true });

    expect(filteredCardsForDeck({ [deck.id]: deck }, [available, future], deck.id, config, now)).toEqual([available]);
    expect(filteredCardsForDeck({}, [available], "missing", config, now)).toEqual([]);
  });
});
