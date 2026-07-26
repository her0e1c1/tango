/** @file Defines shared Card input normalization and validation rules. */

import * as z from "zod";

/** Creates a text rule that rejects empty and whitespace-only values. */
export const requiredCardText = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, { message });

/** Canonicalizes tags so all import entry points compare and persist the same values. */
export const normalizeTags = (tags: readonly string[]): string[] =>
  [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))].sort((left, right) =>
    left.localeCompare(right)
  );

/** Canonicalizes one raw Card while preserving the user's front and back text. */
export const normalizeCardRaw = (card: CardRaw): CardRaw => ({
  frontText: card.frontText,
  backText: card.backText,
  tags: normalizeTags(card.tags),
  uniqueKey: card.uniqueKey.trim(),
});

/** Converts the four supported CSV columns into one canonical raw Card. */
export const cardRawFromCsvColumns = (columns: readonly string[]): CardRaw =>
  normalizeCardRaw({
    frontText: columns[0] ?? "",
    backText: columns[1] ?? "",
    tags: (columns[2] ?? "").split(","),
    uniqueKey: columns[3] ?? "",
  });

export const cardRawSchema: z.ZodType<CardRaw> = z.object({
  frontText: requiredCardText("frontText is required."),
  backText: requiredCardText("backText is required."),
  tags: z.array(z.string()),
  uniqueKey: requiredCardText("uniqueKey is required."),
});
