/**
 * @file Implements application-level Card operations.
 * The functions turn user intent into domain data or coordinated authentication work without
 * depending on React components.
 */

/**
 * Checks whether raw card input has neither front text nor back text.
 * CSV parsing uses this predicate to ignore blank rows while preserving cards that contain either
 * side.
 */
export const isEmpty = (c: CardRaw): boolean => {
  return c.frontText === "" && c.backText === "";
};

/**
 * Converts one CSV row into raw card input.
 * Column parsing and tag splitting happen here before the card receives domain defaults and
 * identifiers.
 */
export const fromRow = (row: string[]): CardRaw => {
  const tags = typeof row[2] === "string" ? row[2].split(",") : [];
  return {
    frontText: row[0] || "",
    backText: row[1] || "",
    tags,
    uniqueKey: row[3] || "",
  };
};

/**
 * Converts a card into the ordered text columns used by CSV export.
 * The reverse mapping keeps exported files compatible with the import parser.
 */
export const toRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];

/**
 * Creates a complete card from raw input, defaults, and generated identifiers.
 * The returned domain object is ready to validate, display, or persist without extra setup from
 * the caller.
 */
export const prepare = (card: CardRaw, deck: CardDeck, generateId: () => string): Card => {
  const { uid, id: deckId } = deck;
  return {
    ...card,
    uid,
    deckId,
    id: generateId(),
    score: 0,
    numberOfSeen: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };
};
