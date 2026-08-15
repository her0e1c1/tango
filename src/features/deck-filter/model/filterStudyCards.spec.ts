import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { filterStudyCards } from "./filterStudyCards";

describe("filterStudyCards", () => {
  const now = 1000;
  const baseDeck = createDeck({ selectedTags: [], tagAndFilter: false, scoreMax: null, scoreMin: null });
  const basePreferences = { useCardInterval: false };

  it("returns all cards when no filters are active", () => {
    const cards = [createCard({ id: "a" }), createCard({ id: "b" })];
    expect(filterStudyCards(cards, baseDeck, basePreferences, now)).toHaveLength(2);
  });

  it("filters tags with OR semantics", () => {
    const cards = [createCard({ id: "a", tags: ["x"] }), createCard({ id: "b", tags: ["y"] })];
    const deck = { ...baseDeck, selectedTags: ["x"], tagAndFilter: false };
    expect(filterStudyCards(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("filters tags with AND semantics", () => {
    const cards = [createCard({ id: "a", tags: ["x", "y"] }), createCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterStudyCards(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("includes the configured score boundaries", () => {
    const cards = [
      createCard({ id: "low", score: 1 }),
      createCard({ id: "middle", score: 2 }),
      createCard({ id: "high", score: 3 }),
    ];
    const deck = { ...baseDeck, scoreMin: 1, scoreMax: 3 };
    expect(filterStudyCards(cards, deck, basePreferences, now).map((card) => card.id)).toEqual([
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
    expect(filterStudyCards(cards, deck, basePreferences, now).map((card) => card.id)).toEqual(["middle"]);
  });

  it("filters unavailable cards when intervals are enabled", () => {
    const cards = [createCard({ id: "future", nextSeeingAt: new Date(now + 1) }), createCard({ id: "available" })];
    expect(filterStudyCards(cards, baseDeck, { useCardInterval: true }, now).map((card) => card.id)).toEqual([
      "available",
    ]);
  });

  it("preserves input order while filtering", () => {
    const cards = [createCard({ id: "seen", numberOfSeen: 5 }), createCard({ id: "new", numberOfSeen: 1 })];
    expect(filterStudyCards(cards, baseDeck, basePreferences, now).map((card) => card.id)).toEqual(["seen", "new"]);
  });
});
