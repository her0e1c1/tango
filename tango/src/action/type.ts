export const deckBulkInsert = (decks: Deck[]) => ({
  type: "DECK_BULK_INSERT",
  payload: { decks },
});

export const deckInsert = (deck: Deck) => deckBulkInsert([deck]);

export const deckBulkUpdate = (decks: Update<Deck>[]) => ({
  type: "DECK_BULK_UPDATE",
  payload: { decks },
});

export const deckUpdate = (deck: Update<Deck>) => deckBulkUpdate([deck]);

export const deckBulkDelete = (ids: string[]) => ({
  type: "DECK_BULK_DELETE",
  payload: { ids },
});

export const deckDelete = (deckId: string) => deckBulkDelete([deckId]);

export const deckEdit = (deck: Edit<Deck>) => ({
  type: "DECK_EDIT",
  payload: { deck },
});

export const cardBulkInsert = (cards: Card[]) => ({
  type: "CARD_BULK_INSERT",
  payload: { cards },
});

export const cardInsert = (card: Card) => cardBulkInsert([card]);

export const cardBulkUpdate = (cards: Update<Card>[]) => ({
  type: "CARD_BULK_UPDATE",
  payload: { cards },
});

export const cardUpdate = (card: Update<Card>) => cardBulkUpdate([card]);

export const cardBulkDelete = (ids: string[]) => ({
  type: "CARD_BULK_DELETE",
  payload: { ids },
});

export const cardDelete = (id: string) => cardBulkDelete([id]);

export const cardEdit = (card: Edit<Card>) => ({
  type: "CARD_EDIT",
  payload: { card },
});

export const sheetBulkInsert = (sheets: Sheet[]) => ({
  type: "SHEET_BULK_INSERT",
  payload: { sheets },
});

export const deckPublicBulkInsert = (decks: Deck[]) => ({
  type: "PUBLIC_DECK_BULK_INSERT",
  payload: { decks },
});

export const clearAll = () => ({
  type: "CLEAR_ALL",
  payload: undefined,
});

export const configUpdate = (config: Partial<ConfigState>) => ({
  type: "CONFIG_UPDATE",
  payload: { config },
});

export const errorReset = () => ({
  type: "ERROR_RESET",
  payload: {},
});
