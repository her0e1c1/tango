export const deckBulkInsert = (decks: Deck[]) => ({
  type: 'DECK_BULK_INSERT',
  payload: { decks },
});

export const deckDelete = (deckId: string) => ({
  type: 'DECK_DELETE',
  payload: { deckId },
});

export const deckBulkDelete = (deckIds: string[]) => ({
  type: 'DECK_BULK_DELETE',
  payload: { deckIds },
});

export const cardBulkInsert = (cards: Card[]) => ({
  type: 'CARD_BULK_INSERT',
  payload: { cards },
});

export const cardDelete = (card: Card) => ({
  type: 'CARD_DELETE',
  payload: { card },
});

export const cardBulkDelete = (deck_id: number) => ({
  type: 'CARD_BULK_DELETE',
  payload: { deck_id },
});

export const card_edit_init = (card: Partial<Card>) => ({
  type: 'CARD_EDIT_INIT',
  payload: { card },
});

export const card_shuffle = (config: ConfigState) => ({
  type: 'CARD_SHUFFLE',
  payload: { config },
});

export const clear_all = () => ({
  type: 'CLEAR_ALL',
  payload: undefined,
});

export const configUpdate = (config: Partial<ConfigState>) => ({
  type: 'CONFIG_UPDATE',
  payload: { config },
});
