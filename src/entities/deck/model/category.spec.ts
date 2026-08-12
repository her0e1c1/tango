import { describe, expect, it } from "vitest";
// biome-ignore lint/correctness/noUnresolvedImports: highlight.js exposes this default through its ESM export map.
import hljs from "highlight.js";

import { CATEGORY, getCategory, isHighlightLanguage } from "./category";

describe("category", () => {
  it("uses Highlight.js languages and aliases as the source of truth", () => {
    const languages = hljs.listLanguages();
    const aliases = languages.flatMap((language) => hljs.getLanguage(language)?.aliases ?? []);

    expect(CATEGORY).toEqual([...new Set(["raw", "math", ...languages, ...aliases])]);
  });

  it("keeps legacy selectable aliases available", () => {
    expect(CATEGORY).toContain("golang");
    expect(CATEGORY).toContain("sh");
  });

  it("uses the first supported tag as the effective category", () => {
    expect(getCategory("markdown", ["unknown", "math", "python"])).toBe("math");
  });

  it("accepts Highlight.js language aliases without maintaining a local mapping", () => {
    expect(isHighlightLanguage("ts")).toBe(true);
    expect(getCategory("markdown", ["ts"])).toBe("ts");
  });

  it("falls back to the deck category when no supported tag exists", () => {
    expect(getCategory("markdown", ["unknown"])).toBe("markdown");
  });
});
