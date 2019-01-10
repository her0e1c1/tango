export const deckBulkInsert = (decks: Deck[]) => ({
  type: 'DECK_BULK_INSERT',
  payload: { decks },
});

export const deckInsert = (deck: Deck) => deckBulkInsert([deck]);

export const deckBulkUpdate = (decks: Partial<Deck> & Pick<Deck, 'id'>[]) => ({
  type: 'DECK_BULK_UPDATE',
  payload: { decks },
});

export const deckUpdate = (deck: Partial<Deck> & Pick<Deck, 'id'>) =>
  deckBulkUpdate([deck]);

export const deckDelete = (deckId: string) => ({
  type: 'DECK_DELETE',
  payload: { deckId },
});

export const deckBulkDelete = (deckIds: string[]) => ({
  type: 'DECK_BULK_DELETE',
  payload: { deckIds },
});

export const deckEdit = (deck: Partial<Deck>) => ({
  type: 'DECK_EDIT',
  payload: { deck },
});

export const cardBulkInsert = (cards: Card[]) => ({
  type: 'CARD_BULK_INSERT',
  payload: { cards },
});

export const cardDelete = (id: string) => ({
  type: 'CARD_DELETE',
  payload: { id },
});

export const cardEdit = (card: Partial<Card>) => ({
  type: 'CARD_EDIT',
  payload: { card },
});

export const cardEditInit = () => ({
  type: 'CARD_EDIT_INIT',
  payload: {},
});

export const card_shuffle = (config: ConfigState) => ({
  type: 'CARD_SHUFFLE',
  payload: { config },
});

export const sheetBulkInsert = (sheets: Sheet[]) => ({
  type: 'SHEET_BULK_INSERT',
  payload: { sheets },
});

export const clearAll = () => ({
  type: 'CLEAR_ALL',
  payload: undefined,
});

export const configUpdate = (config: Partial<ConfigState>) => ({
  type: 'CONFIG_UPDATE',
  payload: { config },
});
