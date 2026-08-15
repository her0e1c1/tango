import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createDeck } from "@/test/factories";
import { CATEGORY, getCategory, isHighlightLanguage, mustFindDeckById } from "./rules";

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
