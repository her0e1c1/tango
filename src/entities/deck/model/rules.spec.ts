import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createDeck } from "@/test/factories";
import {
  CATEGORY,
  getCardFilter,
  getCategory,
  getStudyFilter,
  isDeckTagSelectionMatching,
  isHighlightLanguage,
  mustFindDeckById,
} from "./rules";

describe("CARD-MANAGEMENT-15 CARD-MANAGEMENT-16 category", () => {
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

  it("treats an empty Deck category as plain text", () => {
    const deck = createDeck({ category: "" });

    expect(getCategory(deck.category, [])).toBe("");
    expect(isHighlightLanguage(deck.category)).toBe(false);
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

describe("CARD-FILTER-08 CARD-FILTER-09 CARD-FILTER-12 isDeckTagSelectionMatching", () => {
  it.each([
    { mode: "AND", tagAndFilter: true },
    { mode: "OR", tagAndFilter: false },
  ])("accepts tagged and untagged Cards with no selected tags in $mode mode", ({ tagAndFilter }) => {
    expect(isDeckTagSelectionMatching(["x"], [], tagAndFilter)).toBe(true);
    expect(isDeckTagSelectionMatching([], [], tagAndFilter)).toBe(true);
  });

  it.each([
    { mode: "AND", tagAndFilter: true, expected: [false, false, true, false] },
    { mode: "OR", tagAndFilter: false, expected: [true, true, true, false] },
  ])("matches all four tag combinations in $mode mode", ({ tagAndFilter, expected }) => {
    const candidates = [["x"], ["y"], ["x", "y"], []];
    const selectedTags = ["x", "y"];
    const originalCandidates = structuredClone(candidates);

    expect(candidates.map((tags) => isDeckTagSelectionMatching(tags, selectedTags, tagAndFilter))).toEqual(expected);
    expect(candidates).toEqual(originalCandidates);
    expect(selectedTags).toEqual(["x", "y"]);
  });
});

describe("CARD-FILTER-01 CARD-FILTER-02 STUDY-SESSION-01 Deck filter selection", () => {
  it("returns each saved filter independently without changing the Deck", () => {
    const deck = createDeck({
      cardFilter: { selectedTags: ["browse-x", "browse-y"], tagAndFilter: true },
      studyFilter: { selectedTags: ["study"], tagAndFilter: false },
    });
    const originalDeck = structuredClone(deck);

    expect(getCardFilter(deck)).toEqual({ selectedTags: ["browse-x", "browse-y"], tagAndFilter: true });
    expect(getStudyFilter(deck)).toEqual({ selectedTags: ["study"], tagAndFilter: false });
    expect(deck).toEqual(originalDeck);
  });

  it("defaults an absent browsing filter to an empty OR filter despite saved study conditions", () => {
    const deck = createDeck({
      cardFilter: undefined,
      studyFilter: { selectedTags: ["study"], tagAndFilter: true },
    });
    const originalDeck = structuredClone(deck);

    expect(getCardFilter(deck)).toEqual({ selectedTags: [], tagAndFilter: false });
    expect(deck).toEqual(originalDeck);
  });

  it("defaults an absent study filter to an empty OR filter despite saved browsing conditions", () => {
    const deck = createDeck({
      cardFilter: { selectedTags: ["browse"], tagAndFilter: true },
      studyFilter: undefined,
    });
    const originalDeck = structuredClone(deck);

    expect(getStudyFilter(deck)).toEqual({ selectedTags: [], tagAndFilter: false });
    expect(deck).toEqual(originalDeck);
  });
});
