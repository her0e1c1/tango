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

export const findByName: Select<string, Deck | null> = (deckName) => (state) => {
  const ids = Object.keys(state.deck.byId);
  for (let i = 0; i < ids.length; i++) {
    const d = state.deck.byId[ids[i]];
    if (d?.name === deckName) {
      return d;
    }
  }
  return null;
};
