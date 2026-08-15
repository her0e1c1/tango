import { describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import {
  countCardsByDeckId,
  filterCardsByDeckId,
  filterTagsByDeckId,
  getCardContentValidationErrors,
  hasSameEditableCardContent,
  indexCardsByUniqueKey,
  mustFindCardById,
} from "./rules";

describe("countCardsByDeckId", () => {
  it("counts cards for each deck", () => {
    const counts = countCardsByDeckId([
      createCard({ id: "card-1", deckId: "deck-a" }),
      createCard({ id: "card-2", deckId: "deck-b" }),
      createCard({ id: "card-3", deckId: "deck-a" }),
    ]);

    expect(counts).toEqual(
      new Map([
        ["deck-a", 2],
        ["deck-b", 1],
      ])
    );
  });
});

describe("getCardContentValidationErrors", () => {
  it("returns field errors from the Card content schema", () => {
    expect(getCardContentValidationErrors({ frontText: " ", backText: "\n", tags: [], uniqueKey: "\t" })).toEqual({
      frontText: "Front text is required.",
      backText: "Back text is required.",
      uniqueKey: "Unique key is required.",
    });
  });

  it("returns no errors for valid Card content", () => {
    expect(
      getCardContentValidationErrors({ frontText: "front", backText: "back", tags: [], uniqueKey: "key" })
    ).toEqual({});
  });
});

describe("filterCardsByDeckId", () => {
  it("returns cards matching the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a" });
    const card2 = createCard({ id: "card-2", deckId: "deck-b" });
    const card3 = createCard({ id: "card-3", deckId: "deck-a" });

    expect(filterCardsByDeckId([card1, card2, card3], "deck-a")).toEqual([card1, card3]);
  });
});

describe("indexCardsByUniqueKey", () => {
  it("indexes Cards by their domain key", () => {
    const target = createCard({ uniqueKey: "target" });

    expect(indexCardsByUniqueKey([target]).get("target")).toBe(target);
  });
});

describe("hasSameEditableCardContent", () => {
  it("ignores persistence fields while comparing editable content", () => {
    const left = createCard({ id: "left", frontText: "front", backText: "back", tags: ["tag"] });
    const right = createCard({ id: "right", frontText: "front", backText: "back", tags: ["tag"] });

    expect(hasSameEditableCardContent(left, right)).toBe(true);
  });

  it("detects changed editable content", () => {
    const left = createCard({ backText: "before" });
    const right = createCard({ backText: "after" });

    expect(hasSameEditableCardContent(left, right)).toBe(false);
  });
});

describe("filterTagsByDeckId", () => {
  it("returns unique sorted tags for the specified deckId", () => {
    const card1 = createCard({ id: "card-1", deckId: "deck-a", tags: ["n5", "kanji"] });
    const card2 = createCard({ id: "card-2", deckId: "deck-a", tags: ["kanji", "verb"] });
    const card3 = createCard({ id: "card-3", deckId: "deck-b", tags: ["other"] });

    expect(filterTagsByDeckId([card1, card2, card3], "deck-a")).toEqual(["kanji", "n5", "verb"]);
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
