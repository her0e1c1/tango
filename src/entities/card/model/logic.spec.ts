import { describe, expect, it } from "vitest";

import { selectCardsForDeck, selectTagsForDeck } from "./logic";
import { createCard } from "@/test/factories";

describe("selectCardsForDeck", () => {
  it("returns cards matching the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a" });
    const card2 = createCard({ id: "card-2", deckId: "deck-b" });
    const card3 = createCard({ id: "card-3", deckId: "deck-a" });

    expect(selectCardsForDeck([card1, card2, card3], "deck-a")).toEqual([card1, card3]);
  });
});

describe("selectTagsForDeck", () => {
  it("returns unique sorted tags for the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a", tags: ["n5", "kanji"] });
    const card2 = createCard({ id: "card-2", deckId: "deck-a", tags: ["kanji", "verb"] });
    const card3 = createCard({ id: "card-3", deckId: "deck-b", tags: ["other"] });

    expect(selectTagsForDeck([card1, card2, card3], "deck-a")).toEqual(["kanji", "n5", "verb"]);
  });
});
