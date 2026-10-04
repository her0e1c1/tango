import { describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import {
  filterCardsByDeckId,
  filterCardsByTags,
  filterTagsByDeckId,
  getCardContentValidationErrors,
  mustFindCardById,
} from "./rules";

describe("DECK-IMPORT-02 getCardContentValidationErrors", () => {
  it("returns field errors from the Card content schema", () => {
    expect(getCardContentValidationErrors({ frontText: " ", backText: "\n", tags: [], uniqueKey: "\t" })).toEqual({
      frontText: { field: "frontText", reason: "required" },
      backText: { field: "backText", reason: "required" },
      uniqueKey: { field: "uniqueKey", reason: "required" },
    });
  });

  it("returns no errors for valid Card content", () => {
    expect(
      getCardContentValidationErrors({ frontText: "front", backText: "back", tags: [], uniqueKey: "key" })
    ).toEqual({});
  });
});

describe("CARD-FILTER-01 CARD-FILTER-02 CARD-FILTER-03 filterCardsByDeckId", () => {
  it("returns cards matching the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a" });
    const card2 = createCard({ id: "card-2", deckId: "deck-b" });
    const card3 = createCard({ id: "card-3", deckId: "deck-a" });

    const cards = [card1, card2, card3];
    const originalCards = structuredClone(cards);

    expect(filterCardsByDeckId(cards, "deck-a")).toEqual([card1, card3]);
    expect(cards).toEqual(originalCards);
  });

  it("returns no cards for a Deck without Cards even when another Deck has Cards", () => {
    const cards = [createCard({ id: "other-card", deckId: "other-deck" })];
    const originalCards = structuredClone(cards);

    expect(filterCardsByDeckId(cards, "empty-deck")).toEqual([]);
    expect(cards).toEqual(originalCards);
  });
});

describe("CARD-FILTER-02 filterTagsByDeckId", () => {
  it("returns unique sorted tags for the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a", tags: ["n5", "kanji"] });
    const card2 = createCard({ id: "card-2", deckId: "deck-a", tags: ["kanji", "verb"] });
    const card3 = createCard({ id: "card-3", deckId: "deck-b", tags: ["other"] });

    expect(filterTagsByDeckId([card1, card2, card3], "deck-a")).toEqual(["kanji", "n5", "verb"]);
  });
});

describe("CARD-FILTER-04 CARD-FILTER-08 CARD-FILTER-09 CARD-FILTER-12 filterCardsByTags", () => {
  it.each([
    { mode: "AND", tagAndFilter: true, expectedIds: ["both"] },
    { mode: "OR", tagAndFilter: false, expectedIds: ["x-only", "y-only", "both"] },
  ])("selects each matching Card exactly once in $mode mode", ({ tagAndFilter, expectedIds }) => {
    const cards = [
      createCard({ id: "x-only", tags: ["x"] }),
      createCard({ id: "y-only", tags: ["y"] }),
      createCard({ id: "both", tags: ["x", "y"] }),
      createCard({ id: "neither", tags: [] }),
    ];
    const filter = { selectedTags: ["x", "y"], tagAndFilter };
    const originalCards = structuredClone(cards);
    const originalFilter = structuredClone(filter);

    expect(filterCardsByTags(cards, filter).map((card) => card.id)).toEqual(expectedIds);
    expect(cards).toEqual(originalCards);
    expect(filter).toEqual(originalFilter);
  });

  it.each([
    { mode: "AND", tagAndFilter: true },
    { mode: "OR", tagAndFilter: false },
  ])("keeps tagged and untagged Cards when no tags are selected in $mode mode", ({ tagAndFilter }) => {
    const cards = [createCard({ id: "tagged", tags: ["x"] }), createCard({ id: "untagged", tags: [] })];
    const filter = { selectedTags: [], tagAndFilter };
    const originalCards = structuredClone(cards);
    const originalFilter = structuredClone(filter);

    expect(filterCardsByTags(cards, filter)).toEqual(cards);
    expect(cards).toEqual(originalCards);
    expect(filter).toEqual(originalFilter);
  });

  it("returns no Cards when none have all selected tags without changing the Cards or filter", () => {
    const cards = [createCard({ id: "x-only", tags: ["x"] }), createCard({ id: "y-only", tags: ["y"] })];
    const filter = { selectedTags: ["x", "y"], tagAndFilter: true };
    const originalCards = structuredClone(cards);
    const originalFilter = structuredClone(filter);

    expect(filterCardsByTags(cards, filter)).toEqual([]);
    expect(cards).toEqual(originalCards);
    expect(filter).toEqual(originalFilter);
  });
});

describe("mustFindCardById", () => {
  it("returns the card matching the specified id", () => {
    const target = createCard({ id: "target" });

    expect(mustFindCardById([createCard({ id: "other" }), target], target.id)).toBe(target);
  });

  it("throws when no card matches the specified id", () => {
    expect(() => mustFindCardById([], "missing")).toThrow("Card not found: missing");
  });
});
