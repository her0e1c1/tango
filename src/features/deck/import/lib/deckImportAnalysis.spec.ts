/**
 * @file Verifies deck import planning with automated examples.
 */

import { describe, expect, it } from "vitest";

import { buildDeckImportPlan } from "./deckImportAnalysis";
import { createCard } from "@/test/factories";

describe("buildDeckImportPlan", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("plans an initial import as a create", () => {
    expect(buildDeckImportPlan(rows, [])).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
  });

  it("plans an identical re-import as unchanged", () => {
    expect(buildDeckImportPlan(rows, [createCard(row.card)])).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 1,
    });
  });

  it("plans changed content with the same unique key as an update", () => {
    expect(
      buildDeckImportPlan(rows, [createCard({ ...row.card, frontText: "previous front", uniqueKey: "key-1" })])
    ).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
  });
});
