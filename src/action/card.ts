/**
 * @file Implements application-level Card operations.
 * The functions turn user intent into domain data or coordinated authentication work without
 * depending on React components.
 */

import type { Card } from "@/entities/card";

/**
 * Converts a card into the ordered text columns used by CSV export.
 * The reverse mapping keeps exported files compatible with the import parser.
 */
export const toRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];
