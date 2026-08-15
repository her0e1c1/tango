import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { parseCsv } from "./cardCsv";

describe("card CSV import", () => {
  describe("parseCsv", () => {
    it("parses, normalizes, and validates string content", async () => {
      const analysis = await parseCsv('"front","back"," foo,foo, bar "," key "\n,,,');

      expect(analysis).toEqual({
        rows: [
          {
            rowNumber: 1,
            card: { frontText: "front", backText: "back", uniqueKey: "key", tags: ["foo", "bar"] },
          },
        ],
        skippedRows: [2],
        issues: [],
        invalidCount: 0,
      });
    });

    it("rejects whitespace-only card sides and trimmed duplicate keys", async () => {
      const analysis = await parseCsv('" ","back",""," same "\n"front"," ","","same"');

      expect(analysis.invalidCount).toBe(2);
      expect(analysis.rows).toEqual([]);
      expect(analysis.issues).toEqual([
        { rowNumber: 1, message: "frontText is required.", context: '[" ","back",""," same "]' },
        { rowNumber: 2, message: "backText is required.", context: '["front"," ","","same"]' },
        {
          rowNumber: 2,
          message: 'uniqueKey "same" is duplicated in this file.',
          context: '["front"," ","","same"]',
        },
      ]);
    });

    it("rejects a blank Card unique key with CSV row context", async () => {
      const analysis = await parseCsv('"front","back",""," "');

      expect(analysis).toMatchObject({
        rows: [],
        invalidCount: 1,
        issues: [{ rowNumber: 1, message: "uniqueKey is required.", context: '["front","back",""," "]' }],
      });
    });

    it("rejects unsupported input at the parser boundary", async () => {
      // @ts-expect-error Verifies the runtime boundary for untyped callers.
      await expect(parseCsv({ content: "front,back" })).rejects.toThrow("CSV content must be a string");
    });
  });
});
