import type { Card } from "@/entities/card";
import type { StudyProgress } from "@/entities/study-progress";
import type { StudyCard } from "./studyCard";
import type { StudyPreferences } from "@/entities/preferences";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { filterCardsForDeck } from "./cardSelection";
import { createCard, createDeck } from "@/test/factories";

describe("filterCardsForDeck", () => {
  const now = 1_000;
  const makeCard = (card: Partial<Card>, progress: Partial<StudyProgress> = {}): StudyCard => {
    const content = createCard({ id: "c1", tags: [], ...card });
    return {
      card: content,
      progress: { score: 0, numberOfSeen: 0, ...progress, cardId: content.id },
    };
  };

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
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map(({ card }) => card.id)).toEqual(["a"]);
  });

  it("filters by tag (AND mode)", () => {
    const cards = [makeCard({ id: "a", tags: ["x", "y"] }), makeCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map(({ card }) => card.id)).toEqual(["a"]);
  });

  it("filters by scoreMax", () => {
    const cards = [makeCard({ id: "a" }, { score: 3 }), makeCard({ id: "b" }, { score: 1 })];
    const deck = { ...baseDeck, scoreMax: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map(({ card }) => card.id)).toEqual(["b"]);
  });

  it("filters by scoreMin", () => {
    const cards = [makeCard({ id: "a" }, { score: 1 }), makeCard({ id: "b" }, { score: 3 })];
    const deck = { ...baseDeck, scoreMin: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig, now).map(({ card }) => card.id)).toEqual(["b"]);
  });

  it("filters by card interval when useCardInterval is true", () => {
    const future = new Date(now + 100_000);
    const cards = [makeCard({ id: "a" }, { nextSeeingAt: future }), makeCard({ id: "b" })];
    const preferences = { useCardInterval: true } as StudyPreferences;
    expect(filterCardsForDeck(cards, baseDeck, preferences, now).map(({ card }) => card.id)).toEqual(["b"]);
  });

  it("sorts by numberOfSeen ascending", () => {
    const cards = [makeCard({ id: "a" }, { numberOfSeen: 5 }), makeCard({ id: "b" }, { numberOfSeen: 1 })];
    const result = filterCardsForDeck(cards, baseDeck, baseConfig, now);
    expect(result.map(({ card }) => card.id)).toEqual(["b", "a"]);
  });
});
