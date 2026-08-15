/**
 * @file Provides import feature rules for Deck Import Analysis.
 * Keeping these calculations outside React makes their inputs, outputs, and edge cases easier to
 * understand and test.
 */

import type { Card, CardRaw } from "@/entities/card";

import type { DeckImportPlan, DeckImportPlanRow, DeckImportRow } from "../model/deckImportTypes";

/**
 * Checks whether two imported card values contain the same user-editable content.
 * The comparison decides whether an import row can be skipped instead of written again.
 */
const sameCardContent = (left: CardRaw, right: CardRaw) =>
  left.frontText === right.frontText &&
  left.backText === right.backText &&
  left.tags.join("\0") === right.tags.join("\0");

/**
 * Builds deck import plan from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
export const buildDeckImportPlan = (rows: DeckImportRow[], existingCards: Card[]): DeckImportPlan => {
  const existingByUniqueKey = new Map(existingCards.map((card) => [card.uniqueKey, card]));
  const plannedRows = rows.map((row): DeckImportPlanRow => {
    const existing = existingByUniqueKey.get(row.card.uniqueKey);
    const plannedAction = existing == null ? "create" : sameCardContent(existing, row.card) ? "unchanged" : "update";
    return { ...row, action: plannedAction };
  });

  return {
    rows: plannedRows,
    created: plannedRows.filter((row) => row.action === "create").length,
    updated: plannedRows.filter((row) => row.action === "update").length,
    unchanged: plannedRows.filter((row) => row.action === "unchanged").length,
  };
};
