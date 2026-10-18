import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { parseCsv } from "./cardCsv";

describe("DECK-IMPORT-01 DECK-IMPORT-02 card CSV import", () => {
  describe("parseCsv", () => {
    it("parses, normalizes, and validates string content", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv('"front","back"," foo,foo, bar "," key "\n,,,');

      // Then: Verify the expected result in the assertions below.
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
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv('" ","back",""," same "\n"front"," ","","same"');

      // Then: Verify the expected result in the assertions below.
      expect(analysis.invalidCount).toBe(2);
      expect(analysis.rows).toEqual([]);
      expect(analysis.issues).toEqual([
        {
          rowNumber: 1,
          diagnostic: { kind: "card", field: "frontText", reason: "required" },
          context: '[" ","back",""," same "]',
        },
        {
          rowNumber: 2,
          diagnostic: { kind: "card", field: "backText", reason: "required" },
          context: '["front"," ","","same"]',
        },
        {
          rowNumber: 2,
          diagnostic: { kind: "duplicate", uniqueKey: "same" },
          context: '["front"," ","","same"]',
        },
      ]);
    });

    it("rejects a blank Card unique key with CSV row context", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv('"front","back",""," "');

      // Then: Verify the expected result in the assertions below.
      expect(analysis).toMatchObject({
        rows: [],
        invalidCount: 1,
        issues: [
          {
            rowNumber: 1,
            diagnostic: { kind: "card", field: "uniqueKey", reason: "required" },
            context: '["front","back",""," "]',
          },
        ],
      });
    });

    it("keeps an empty tag column as an untagged valid Card", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Evaluate `parseCsv` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(await parseCsv("front,back,,key")).toEqual({
        rows: [{ rowNumber: 1, card: { frontText: "front", backText: "back", tags: [], uniqueKey: "key" } }],
        skippedRows: [],
        issues: [],
        invalidCount: 0,
      });
    });

    it("counts a three-column row as invalid and retains its diagnostic", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Evaluate `parseCsv` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(await parseCsv("front,back,key")).toEqual({
        rows: [],
        skippedRows: [],
        issues: [{ rowNumber: 1, diagnostic: { kind: "columns", count: 3 }, context: '["front","back","key"]' }],
        invalidCount: 1,
      });
    });

    it("keeps logical record numbers and original column context after multiline fields and blank records", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv(
        '"front\ncontinued","back"," foo,foo, bar "," key "\n\n"bad ""front""","back"," key "\n" "," "," foo,foo, bar "," key "'
      );

      // Then: Verify the expected result in the assertions below.
      expect(analysis).toEqual({
        rows: [
          {
            rowNumber: 1,
            card: { frontText: "front\ncontinued", backText: "back", tags: ["foo", "bar"], uniqueKey: "key" },
          },
        ],
        skippedRows: [2],
        issues: [
          {
            rowNumber: 3,
            diagnostic: { kind: "columns", count: 3 },
            context: '["bad \\"front\\"","back"," key "]',
          },
          {
            rowNumber: 4,
            diagnostic: { kind: "card", field: "frontText", reason: "required" },
            context: '[" "," "," foo,foo, bar "," key "]',
          },
          {
            rowNumber: 4,
            diagnostic: { kind: "card", field: "backText", reason: "required" },
            context: '[" "," "," foo,foo, bar "," key "]',
          },
          {
            rowNumber: 4,
            diagnostic: { kind: "duplicate", uniqueKey: "key" },
            context: '[" "," "," foo,foo, bar "," key "]',
          },
        ],
        invalidCount: 2,
      });
    });

    it.each([
      { record: '"unterminated', code: "MissingQuotes", context: '["unterminated"]' },
      { record: '"bad"tail,back,,key', code: "InvalidQuotes", context: '["bad\\"tail,back,,key"]' },
    ])("reports $code from real CSV with logical record context", async ({ record, code, context }) => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv(`"front\ncontinued",back,,key\n\n${record}`);

      // Then: Verify the expected result in the assertions below.
      expect(analysis.rows).toEqual([
        {
          rowNumber: 1,
          card: { frontText: "front\ncontinued", backText: "back", tags: [], uniqueKey: "key" },
        },
      ]);
      expect(analysis.skippedRows).toEqual([2]);
      expect(analysis.issues).toEqual(
        expect.arrayContaining([{ rowNumber: 3, diagnostic: { kind: "parser", type: "Quotes", code }, context }])
      );
      expect(analysis.issues.every((issue) => issue.rowNumber === 3 && issue.context === context)).toBe(true);
      expect(analysis.invalidCount).toBe(1);
    });

    it("keeps file-level empty-input diagnostics separate from record diagnostics", async () => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `parseCsv` with the prepared inputs.
      const analysis = await parseCsv("   ");

      // Then: Verify the expected result in the assertions below.
      expect(analysis.rows).toEqual([]);
      expect(analysis.issues).toEqual(expect.arrayContaining([{ diagnostic: { kind: "empty" } }]));
      for (const issue of analysis.issues) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        expect(issue).not.toHaveProperty("rowNumber");
        expect(issue).not.toHaveProperty("context");
      }
    });

    it("rejects unsupported input at the parser boundary", async () => {
      // @ts-expect-error Verifies the runtime boundary for untyped callers.
      // Given: Use this case's inputs and any shared test setup.
      // When: Evaluate `parseCsv` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(parseCsv({ content: "front,back" })).rejects.toThrow("CSV content must be a string");
    });
  });
});
