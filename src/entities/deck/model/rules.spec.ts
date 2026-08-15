import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { CATEGORY, filterCardsForDeck, getCategory, isHighlightLanguage, mustFindDeckById } from "./rules";

describe("category", () => {
  it("defines supported categories including application categories and major languages", () => {
    expect(CATEGORY).toContain("raw");
    expect(CATEGORY).toContain("math");
    expect(CATEGORY).toContain("python");
    expect(CATEGORY).toContain("typescript");
    expect(CATEGORY).toContain("javascript");
    expect(CATEGORY).toContain("golang");
    expect(CATEGORY).toContain("sh");
  });

  it("identifies code languages correctly", () => {
    expect(isHighlightLanguage("ts")).toBe(true);
    expect(isHighlightLanguage("python")).toBe(true);
    expect(isHighlightLanguage("raw")).toBe(false);
    expect(isHighlightLanguage("math")).toBe(false);
    expect(isHighlightLanguage("unknown")).toBe(false);
  });

  it("uses the first supported tag as the effective category", () => {
    expect(getCategory("markdown", ["unknown", "math", "python"])).toBe("math");
  });

  it("accepts language aliases for tag resolution", () => {
    expect(isHighlightLanguage("ts")).toBe(true);
    expect(getCategory("markdown", ["ts"])).toBe("ts");
  });

  it("falls back to the deck category when no supported tag exists", () => {
    expect(getCategory("markdown", ["unknown"])).toBe("markdown");
  });
});

describe("mustFindDeckById", () => {
  it("returns the deck matching the specified id", () => {
    const target = createDeck({ id: "target" });

    expect(mustFindDeckById([createDeck({ id: "other" }), target], target.id)).toBe(target);
  });

  it("throws when no deck matches the specified id", () => {
    expect(() => mustFindDeckById([], "missing")).toThrow("Deck not found: missing");
  });
});

describe("filterCardsForDeck", () => {
  const now = 1000;
  const baseDeck = createDeck({ selectedTags: [], tagAndFilter: false, scoreMax: null, scoreMin: null });
  const basePreferences = { useCardInterval: false };

  it("returns all cards when no filters are active", () => {
    const cards = [createCard({ id: "a" }), createCard({ id: "b" })];
    expect(filterCardsForDeck(cards, baseDeck, basePreferences, now)).toHaveLength(2);
  });

  it("filters tags with OR semantics", () => {
    const cards = [createCard({ id: "a", tags: ["x"] }), createCard({ id: "b", tags: ["y"] })];
    const deck = { ...baseDeck, selectedTags: ["x"], tagAndFilter: false };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("filters tags with AND semantics", () => {
    const cards = [createCard({ id: "a", tags: ["x", "y"] }), createCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("includes the configured score boundaries", () => {
    const cards = [
      createCard({ id: "low", score: 1 }),
      createCard({ id: "middle", score: 2 }),
      createCard({ id: "high", score: 3 }),
    ];
    const deck = { ...baseDeck, scoreMin: 1, scoreMax: 3 };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map((card) => card.id)).toEqual([
      "low",
      "middle",
      "high",
    ]);
  });

  it("excludes scores outside the configured range", () => {
    const cards = [
      createCard({ id: "low", score: 1 }),
      createCard({ id: "middle", score: 2 }),
      createCard({ id: "high", score: 3 }),
    ];
    const deck = { ...baseDeck, scoreMin: 2, scoreMax: 2 };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["middle"]);
  });

  it("filters unavailable cards when intervals are enabled", () => {
    const cards = [createCard({ id: "future", nextSeeingAt: new Date(now + 1) }), createCard({ id: "available" })];
    expect(filterCardsForDeck(cards, baseDeck, { useCardInterval: true }, now).map((card) => card.id)).toEqual([
      "available",
    ]);
  });

  it("preserves input order while filtering", () => {
    const cards = [createCard({ id: "seen", numberOfSeen: 5 }), createCard({ id: "new", numberOfSeen: 1 })];
    expect(filterCardsForDeck(cards, baseDeck, basePreferences, now).map((card) => card.id)).toEqual(["seen", "new"]);
  });
});
