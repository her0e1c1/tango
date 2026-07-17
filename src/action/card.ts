import * as firestore from "@/action/firestore";

export const isEmpty = (c: CardRaw): boolean => {
  return c.frontText === "" && c.backText === "";
};

export const fromRow = (row: string[]): CardRaw => {
  const tags = typeof row[2] === "string" ? row[2].split(",") : [];
  return {
    frontText: row[0] || "",
    backText: row[1] || "",
    tags,
    uniqueKey: row[3] || "",
  };
};

export const toRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];

export const prepare = (card: CardRaw, deck: CardDeck): Card => {
  const { uid, id: deckId } = deck;
  return {
    ...card,
    uid,
    deckId,
    id: firestore.mocked.generateCardId(),
    score: 0,
    numberOfSeen: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };
};
