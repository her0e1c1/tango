import { cardContentSchema } from "./schema";
import type { Card, CardId, CardRaw } from "./types";

const cardContentFields: ReadonlySet<string> = new Set(["frontText", "backText", "tags", "uniqueKey"]);
// Narrows an arbitrary validation path segment to a Card content field that callers can display safely.
const isCardContentField = (field: PropertyKey | undefined): field is keyof CardRaw =>
  typeof field === "string" && cardContentFields.has(field);

type CardContentErrors = Partial<Record<keyof CardRaw, { field: keyof CardRaw; reason: "required" | "invalid" }>>;

// Validates Card content and returns at most the first error for each recognized field.
export const getCardContentValidationErrors = (card: CardRaw): CardContentErrors => {
  const validation = cardContentSchema.safeParse(card);
  if (validation.success) return {};

  // Keep Zod issue paths inside the Entity boundary so feature adapters only handle Card fields.
  const errors: CardContentErrors = {};
  for (const issue of validation.error.issues) {
    const [field] = issue.path;
    if (isCardContentField(field) && errors[field] === undefined)
      errors[field] = { field, reason: issue.code === "custom" ? "required" : "invalid" };
  }
  return errors;
};

// Selects Cards owned by the requested Deck while preserving their original order.
export const filterCardsByDeckId = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

// Collects unique tags for one Deck and sorts them so filter controls receive a deterministic order.
export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterCardsByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();

// Returns the requested Card or throws when a caller's Card reference no longer resolves.
export const mustFindCardById = (cards: readonly Card[], id: CardId): Card => {
  const card = cards.find((candidate) => candidate.id === id);

  if (card == null) throw new Error(`Card not found: ${id}`);

  return card;
};

export function filterCardsByTags(cards: Card[], filter: { selectedTags: string[]; tagAndFilter: boolean }): Card[] {
  if (filter.selectedTags.length === 0) return cards;
  return cards.filter((card) =>
    filter.tagAndFilter
      ? filter.selectedTags.every((tag) => card.tags.includes(tag))
      : filter.selectedTags.some((tag) => card.tags.includes(tag))
  );
}
