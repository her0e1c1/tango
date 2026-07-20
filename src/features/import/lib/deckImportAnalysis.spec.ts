/**
 * @file Verifies the "parseDeckImportCsv" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "separates valid, skipped,
 * and invalid rows with context", "rejects an empty file", "reports duplicate unique keys with row
 * context".
 */

import { describe, expect, it } from "vitest";

import { buildDeckImportPlan, parseDeckImportCsv } from "@/features/import/lib/deckImportAnalysis";
import { createCard } from "@/test/factories";

describe("parseDeckImportCsv", () => {
  it("separates valid, skipped, and invalid rows with context", async () => {
    const result = await parseDeckImportCsv(
      '"front","back","tag","key-1"\n\n"missing","columns"\n"other","back","",""'
    );

    expect(result.rows).toEqual([
      {
        rowNumber: 1,
        card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
      },
    ]);
    expect(result.skippedRows).toEqual([2]);
    expect(result.invalidCount).toBe(2);
    expect(result.issues).toEqual([
      {
        rowNumber: 3,
        message: "Expected 4 columns, found 2.",
        context: '["missing","columns"]',
      },
      {
        rowNumber: 4,
        message: "uniqueKey is required.",
        context: '["other","back","",""]',
      },
    ]);
  });

  it("rejects an empty file", async () => {
    const result = await parseDeckImportCsv("");

    expect(result.rows).toEqual([]);
    expect(result.invalidCount).toBe(1);
    expect(result.issues).toContainEqual({ message: "The CSV file is empty." });
  });

  it("reports duplicate unique keys with row context", async () => {
    const result = await parseDeckImportCsv('"one","back","","same"\n"two","back","","same"');

    expect(result.issues).toContainEqual({
      rowNumber: 2,
      message: 'uniqueKey "same" is duplicated in this file.',
      context: '["two","back","","same"]',
    });
  });

  it("reports CSV parse errors with row context", async () => {
    const result = await parseDeckImportCsv('"one","back","","key"\n"unterminated');

    expect(result.issues).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        context: expect.stringContaining("unterminated"),
      }),
    ]);
  });
});

describe("buildDeckImportPlan", () => {
  const rows = [
    {
      rowNumber: 1,
      card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
    },
  ];

  it("plans an initial import as a create", () => {
    expect(buildDeckImportPlan(rows, [])).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
  });

  it("plans an identical re-import as unchanged", () => {
    expect(buildDeckImportPlan(rows, [createCard(rows[0]?.card)])).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 1,
    });
  });

  it("plans changed content with the same unique key as an update", () => {
    expect(
      buildDeckImportPlan(rows, [createCard({ ...rows[0]?.card, frontText: "previous front", uniqueKey: "key-1" })])
    ).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
  });
});
