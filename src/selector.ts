export const getCardList = (state: RootState, deck_id: number) => {
  const all = state.card.byDeckId[deck_id] || [];
  return all.map(id => state.card.byId[id]);
};

export const getCurrentCard = (state: RootState) => {
  const cards = getCurrentCardList(state);
  if (state.nav.index) {
    return cards[state.nav.index];
  }
  return state.nav.card;
};
export const getCurrentCardList = (state: RootState): Card[] => {
  const deck = state.nav.deck;
  const config = state.config;
  if (deck) {
    const ids = state.card.byDeckId[deck.id] || [];
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
