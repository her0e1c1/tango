import { cardContentSchema } from "./schema";
import type { Card, CardId, CardRaw } from "./types";

const cardContentFields: ReadonlySet<string> = new Set(["frontText", "backText", "tags", "uniqueKey"]);
const isCardContentField = (field: PropertyKey | undefined): field is keyof CardRaw =>
  typeof field === "string" && cardContentFields.has(field);

export const countCardsByDeckId = (cards: readonly Card[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const card of cards) counts.set(card.deckId, (counts.get(card.deckId) ?? 0) + 1);
  return counts;
};

export const getCardContentValidationErrors = (card: CardRaw): Partial<Record<keyof CardRaw, string>> => {
  const validation = cardContentSchema.safeParse(card);
  if (validation.success) return {};

  // Keep Zod issue paths inside the Entity boundary so feature adapters only handle Card fields.
  const errors: Partial<Record<keyof CardRaw, string>> = {};
  for (const issue of validation.error.issues) {
    const [field] = issue.path;
    if (isCardContentField(field) && errors[field] === undefined) errors[field] = issue.message;
  }
  return errors;
};

export const filterCardsByDeckId = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const indexCardsByUniqueKey = <T extends Card>(cards: readonly T[]): Map<string, T> =>
  new Map(cards.map((card) => [card.uniqueKey, card]));

export const hasSameEditableCardContent = (left: CardRaw, right: CardRaw): boolean =>
  left.frontText === right.frontText &&
  left.backText === right.backText &&
  left.tags.join("\0") === right.tags.join("\0");

export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterCardsByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();

export const mustFindCardById = (cards: readonly Card[], id: CardId): Card => {
  const card = cards.find((candidate) => candidate.id === id);

  if (card == null) throw new Error(`Card not found: ${id}`);

  return card;
};
