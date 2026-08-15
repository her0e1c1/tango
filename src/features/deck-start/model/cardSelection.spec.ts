import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createStudyProgress } from "@/test/factories";
import { filterCardsForDeck } from "./cardSelection";

describe("filterCardsForDeck", () => {
  const now = 1_000;
  const makeCard = (
    cardOverrides: Parameters<typeof createCard>[0],
    progressOverrides: Parameters<typeof createStudyProgress>[0] = {}
  ) => {
    const card = createCard(cardOverrides);
    return { card, progress: createStudyProgress({ ...progressOverrides, cardId: card.id }) };
  };
  const baseDeck = createDeck({ selectedTags: [], tagAndFilter: false, scoreMax: null, scoreMin: null });
  const basePreferences = { useCardInterval: false };

  it("returns all cards when no filters are active", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    expect(filterCardsForDeck(cards, baseDeck, basePreferences, now)).toHaveLength(2);
  });

  it("filters tags with OR semantics", () => {
    const cards = [makeCard({ id: "a", tags: ["x"] }), makeCard({ id: "b", tags: ["y"] })];
    const deck = { ...baseDeck, selectedTags: ["x"], tagAndFilter: false };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map(({ card }) => card.id)).toEqual(["a"]);
  });

  it("filters tags with AND semantics", () => {
    const cards = [makeCard({ id: "a", tags: ["x", "y"] }), makeCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map(({ card }) => card.id)).toEqual(["a"]);
  });

  it("includes the configured score boundaries", () => {
    const cards = [
      makeCard({ id: "low" }, { score: 1 }),
      makeCard({ id: "middle" }, { score: 2 }),
      makeCard({ id: "high" }, { score: 3 }),
    ];
    const deck = { ...baseDeck, scoreMin: 1, scoreMax: 3 };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map(({ card }) => card.id)).toEqual([
      "low",
      "middle",
      "high",
    ]);
  });

  it("excludes scores outside the configured range", () => {
    const cards = [
      makeCard({ id: "low" }, { score: 1 }),
      makeCard({ id: "middle" }, { score: 2 }),
      makeCard({ id: "high" }, { score: 3 }),
    ];
    const deck = { ...baseDeck, scoreMin: 2, scoreMax: 2 };
    expect(filterCardsForDeck(cards, deck, basePreferences, now).map(({ card }) => card.id)).toEqual(["middle"]);
  });

  it("filters unavailable cards when intervals are enabled", () => {
    const cards = [makeCard({ id: "future" }, { nextSeeingAt: new Date(now + 1) }), makeCard({ id: "available" })];
    expect(filterCardsForDeck(cards, baseDeck, { useCardInterval: true }, now).map(({ card }) => card.id)).toEqual([
      "available",
    ]);
  });

  it("orders cards by study progress", () => {
    const cards = [makeCard({ id: "seen" }, { numberOfSeen: 5 }), makeCard({ id: "new" }, { numberOfSeen: 1 })];
    expect(filterCardsForDeck(cards, baseDeck, basePreferences, now).map(({ card }) => card.id)).toEqual([
      "new",
      "seen",
    ]);
  });
});
