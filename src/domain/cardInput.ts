/** @file Defines shared Card input normalization and validation rules. */

import * as z from "zod";

/** Creates a text rule that rejects empty and whitespace-only values. */
export const requiredCardText = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, { message });

/** Canonicalizes tags while preserving the first occurrence order from the user's input. */
export const normalizeTags = (tags: readonly string[]): string[] => {
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (tag === "" || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized;
};

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
