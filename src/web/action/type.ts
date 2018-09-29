export const configUpdate = (config: Partial<ConfigState>) => ({
  type: 'CONFIG_UPDATE',
  payload: { config },
});

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

export const cardDelete = (id: string) => ({
  type: 'CARD_DELETE',
  payload: { id },
});
