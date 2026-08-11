import type { CardRaw } from "@/entities/card";

import { describe, expect, expectTypeOf, it } from "vitest";

import { fromRow, isEmpty, parseCsv } from "@/features/import/lib/cardCsv";

describe("card CSV import", () => {
  describe("fromRow", () => {
    it("maps CSV columns to raw card data", () => {
      expect(fromRow(["front", "back", "a,b,c", "123"])).toEqual({
        frontText: "front",
        backText: "back",
        tags: ["a", "b", "c"],
        uniqueKey: "123",
      });
    });

    it("uses empty values for missing columns", () => {
      expect(fromRow([])).toEqual({ frontText: "", backText: "", tags: [], uniqueKey: "" });
    });
  });

  describe("isEmpty", () => {
    it("ignores tags and keys when both card sides are empty", () => {
      expect(isEmpty({ frontText: "", backText: "", tags: ["tag"], uniqueKey: "key" })).toBe(true);
    });

    it("keeps a card when either side has content", () => {
      expect(isEmpty({ frontText: "front", backText: "", tags: [], uniqueKey: "" })).toBe(false);
      expect(isEmpty({ frontText: "", backText: "back", tags: [], uniqueKey: "" })).toBe(false);
    });
  });

  describe("parseCsv", () => {
    it("parses string content and removes empty rows", async () => {
      const cards = await parseCsv("front,back\n,,tag,key");

      expectTypeOf(cards).toEqualTypeOf<CardRaw[]>();
      expect(cards).toEqual([{ frontText: "front", backText: "back", uniqueKey: "", tags: [] }]);
    });

    it("rejects unsupported input at the parser boundary", async () => {
      await expect(parseCsv({ content: "front,back" })).rejects.toThrow("CSV content must be a string or File");
    });
  });
});
