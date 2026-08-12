import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/shared/config";

import { describe, expect, it } from "vitest";

import { filterCardsForDeck } from "@/features/study/model/cardSelection";
import { createDeck } from "@/test/factories";

describe("filterCardsForDeck", () => {
  const now = 1_000;
  const makeCard = (overrides: Partial<Card>): Card =>
    ({
      id: "c1",
      score: 0,
      numberOfSeen: 0,
      tags: [],
      nextSeeingAt: undefined,
      ...overrides,
    }) as Card;

  const baseDeck = createDeck({
    selectedTags: [],
    tagAndFilter: false,
    scoreMax: null,
    scoreMin: null,
  });

  const baseConfig = { useCardInterval: false } as StudyPreferences;

  it("returns all cards when no filters active", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    expect(filterCardsForDeck(cards, baseDeck, baseConfig, now)).toHaveLength(2);
  });

  it("filters by tag (OR mode)", () => {
    const cards = [makeCard({ id: "a", tags: ["x"] }), makeCard({ id: "b", tags: ["y"] })];
    const deck = { ...baseDeck, selectedTags: ["x"], tagAndFilter: false };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("filters by tag (AND mode)", () => {
    const cards = [makeCard({ id: "a", tags: ["x", "y"] }), makeCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map((card) => card.id)).toEqual(["a"]);
  });

  it("filters by scoreMax", () => {
    const cards = [makeCard({ id: "a", score: 3 }), makeCard({ id: "b", score: 1 })];
    const deck = { ...baseDeck, scoreMax: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map((card) => card.id)).toEqual(["b"]);
  });

  it("filters by scoreMin", () => {
    const cards = [makeCard({ id: "a", score: 1 }), makeCard({ id: "b", score: 3 })];
    const deck = { ...baseDeck, scoreMin: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map((card) => card.id)).toEqual(["b"]);
  });

  it("filters by card interval when useCardInterval is true", () => {
    const future = new Date(now + 100_000);
    const cards = [makeCard({ id: "a", nextSeeingAt: future }), makeCard({ id: "b" })];
    const config = { useCardInterval: true } as StudyPreferences;
    expect(filterCardsForDeck(cards, baseDeck, config, now).map((card) => card.id)).toEqual(["b"]);
  });

  it("sorts by numberOfSeen ascending", () => {
    const cards = [makeCard({ id: "a", numberOfSeen: 5 }), makeCard({ id: "b", numberOfSeen: 1 })];
    const result = filterCardsForDeck(cards, baseDeck, baseConfig, now);
    expect(result.map((card) => card.id)).toEqual(["b", "a"]);
  });
});
