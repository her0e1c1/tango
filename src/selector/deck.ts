export const allIds: Select0<string[]> = () => (state) => Object.keys(state.deck.byId);

export const getAll: Select0<Deck[]> = () => (state) => {
  const ids = Object.keys(state.deck.byId);
  return ids.map((id) => state.deck.byId[id] as Deck);
};

export const getById: Select<string, Deck> = (deckId) => (state) => {
  const deck = state.deck.byId[deckId];
  if (deck == null) throw new Error(`NO DECK ${deckId}`);
  return deck;
};

export const findByName: Select<string, DeckId | null> = (deckName) => (state) => {
  for (const [id, deck] of Object.entries(state.deck.byId)) {
    if (deck?.name === deckName) {
      return id;
    }
  }
  return null;
};

export const getByCardId: Select<CardId, Deck> = (cardId) => (state) => {
  const card = state.card.byId[cardId];
  if (card == null) throw Error("invalid card id");
  const deck = state.deck.byId[card.deckId];
  if (deck == null) throw Error("invalid deck id");
  return deck;
};
