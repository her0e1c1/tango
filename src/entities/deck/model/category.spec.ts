import { describe, expect, it } from "vitest";

import { getCategory } from "./category";

describe("getCategory", () => {
  it("uses the first supported tag as the effective category", () => {
    expect(getCategory("markdown", ["unknown", "math", "python"])).toBe("math");
  });

  it("maps shorthand language tags before resolving the category", () => {
    expect(getCategory("markdown", ["ts"])).toBe("typescript");
  });

  it("falls back to the deck category when no supported tag exists", () => {
    expect(getCategory("markdown", ["unknown"])).toBe("markdown");
  });
});
