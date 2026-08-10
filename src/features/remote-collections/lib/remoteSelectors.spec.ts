/**
 * @file Verifies the "remote collection selectors" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "omits undefined collection
 * entries", "selects Cards and sorted unique tags for one Deck", "filters Deck Cards using the
 * supplied time".
 */

import { describe, expect, it } from "vitest";

import { cardsForDeck, remoteValues, tagsForDeck } from "@/features/remote-collections/lib/remoteSelectors";
import { createCard } from "@/entities/card";

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
});
