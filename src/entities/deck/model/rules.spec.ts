import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createStudyProgress } from "@/test/factories";
import { CATEGORY, getCategory, isHighlightLanguage, mustFindDeckById, selectStudyCards } from "./rules";

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

describe("selectStudyCards", () => {
  const card = createCard({ id: "card", tags: ["selected"] });
  const progress = createStudyProgress({ cardId: card.id, score: 1 });
  const deck = createDeck({ selectedTags: ["selected"], scoreMin: 0, scoreMax: 2 });

  it("joins Cards with progress and applies the Deck study constraints", () => {
    const options = { useCardInterval: true, now: 1000 };
    expect(selectStudyCards([card], [progress], deck, options)).toEqual([{ card, progress }]);
    expect(selectStudyCards([card], [], deck, options)).toEqual([]);
    expect(selectStudyCards([{ ...card, tags: [] }], [progress], deck, options)).toEqual([]);
    expect(
      selectStudyCards(
        [card],
        [progress],
        { ...deck, selectedTags: ["selected", "other"], tagAndFilter: true },
        options
      )
    ).toEqual([]);
    expect(selectStudyCards([card], [{ ...progress, score: 3 }], deck, options)).toEqual([]);
    expect(selectStudyCards([card], [{ ...progress, nextSeeingAt: new Date(1001) }], deck, options)).toEqual([]);
    expect(
      selectStudyCards(
        [{ ...card, tags: [] }],
        [{ ...progress, nextSeeingAt: new Date(1001) }],
        { ...deck, selectedTags: [] },
        { ...options, useCardInterval: false }
      )
    ).toHaveLength(1);
  });
});
