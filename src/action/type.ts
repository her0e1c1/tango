export const deck_bulk_insert = (decks: Deck[]) => ({
  type: 'DECK_BULK_INSERT',
  payload: { decks },
});

export const deck_bulk_delete = (decks: Deck[]) => ({
  type: 'DECK_BULK_DELETE',
  payload: { decks },
});

export const deck_edit = (deck: Partial<Deck>) => ({
  type: 'DECK_EDIT',
  payload: { deck },
});

export const card_bulk_insert = (cards: Card[]) => ({
  type: 'CARD_BULK_INSERT',
  payload: { cards },
});

export const card_delete = (card: Card) => ({
  type: 'CARD_DELETE',
  payload: { card },
});

export const card_bulk_delete = (deck_id: number) => ({
  type: 'CARD_BULK_DELETE',
  payload: { deck_id },
});

export const card_edit = (card: Partial<Card>) => ({
  type: 'CARD_EDIT',
  payload: { card },
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

export const share_deck_bulk_insert = (deck: Deck, uid: string) => ({
  type: 'SHARE_DECK_BULK_INSERT',
  payload: { deck, uid },
});

export const share_deck_bulk_delete = (deck_id: number, uid: string) => ({
  type: 'SHARE_DECK_BULK_DELETE',
  payload: { deck_id, uid },
});

export const share_card_bulk_insert = (cards: Card[], uid: string) => ({
  type: 'SHARE_CARD_BULK_INSERT',
  payload: { cards, uid },
});

export const drive_bulk_insert = (drives: Drive[]) => ({
  type: 'SHARE_BULK_INSERT',
  payload: { drives },
});

export const user_init = (user: UserState) => ({
  type: 'USER_INIT',
  payload: { user },
});

export const user_logout = () => ({
  type: 'USER_LOGOUT',
  payload: undefined,
});
