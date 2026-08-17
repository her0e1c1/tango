import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createStudyProgress } from "@/test/factories";
import { CATEGORY, getCategory, isHighlightLanguage, isStudyCardEligible, mustFindDeckById } from "./rules";

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

describe("isStudyCardEligible", () => {
  const card = createCard({ id: "card", tags: ["selected"] });
  const progress = createStudyProgress({ cardId: card.id, score: 1 });
  const deck = createDeck({ selectedTags: ["selected"], scoreMin: 0, scoreMax: 2 });

  it("requires the Deck tag, score, and due-time constraints to pass", () => {
    const options = { useCardInterval: true, now: 1000 };
    expect(isStudyCardEligible(card, progress, deck, options)).toBe(true);
    expect(isStudyCardEligible({ ...card, tags: [] }, progress, { ...deck, selectedTags: [] }, options)).toBe(true);
    expect(isStudyCardEligible({ ...card, tags: [] }, progress, deck, options)).toBe(false);
    expect(
      isStudyCardEligible(card, progress, { ...deck, selectedTags: ["selected", "other"], tagAndFilter: true }, options)
    ).toBe(false);
    expect(isStudyCardEligible(card, { ...progress, score: 3 }, deck, options)).toBe(false);
    expect(isStudyCardEligible(card, { ...progress, nextSeeingAt: new Date(1001) }, deck, options)).toBe(false);
    expect(
      isStudyCardEligible(card, { ...progress, nextSeeingAt: new Date(1001) }, deck, {
        ...options,
        useCardInterval: false,
      })
    ).toBe(true);
  });
});
