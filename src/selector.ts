export const getDecks = (
  state: RootState,
  isPublic: boolean = false
): Deck[] => {
  if (isPublic) {
    return Object.values(state.deck.byId).filter(
      d => d.uid != state.config.uid
    );
  } else {
    return Object.values(state.deck.byId).filter(
      d => d.uid == state.config.uid
    );
  }
};

export const getCurrentPage = (state: RootState): NavState | undefined => {
  const i = state.nav.index;
  const r = state.nav.routes;
  if (r) {
    const i2 = r[i].index;
    const r2 = r[i].routes;
    if (r2) {
      return r2[i2];
    }
  }
  return undefined;
};

export const getCurrentDeck = (state: RootState): Deck => {
  const r = getCurrentPage(state);
  const deckId = r && r.params && r.params.deckId;
  return state.deck.byId[deckId] || {};
};

export const getCardList = (state: RootState, deckId: string) => {
  const all = state.card.byDeckId[deckId] || [];
  return all.map(id => state.card.byId[id]);
};

export const getCurrentCard = (state: RootState): Card => {
  const cards = getCurrentCardList(state);
  const deck = getCurrentDeck(state);
  if (deck.currentIndex >= 0) {
    return cards[deck.currentIndex];
  }
  return {} as Card;
};
export const getCurrentCardList = (state: RootState): Card[] => {
  const config = state.config;
  const deckId = getCurrentDeck(state).id;
  if (deckId) {
    const ids = state.card.byDeckId[deckId] || [];
    const cards = ids
      .map(id => state.card.byId[id])
      .filter(c => !!c) // defensive
      .filter(c => {
        if (config.showMastered) {
          return true;
        } else {
          return !c.mastered;
        }
      });
    return cards.slice(config.start);
  } else {
    return [];
  }
};
