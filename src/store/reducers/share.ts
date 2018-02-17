export default (state: ShareState = { user: {} }, action: Redux.Action) => {
  if (action.type == 'SHARE_DECK_BULK_INSERT') {
    const p = action.payload;
    if (!state.user[p.uid]) {
      state.user[p.uid] = {
        deck: { byId: {} },
        card: { byId: {} },
      };
    }
    Object.entries(p.deck).forEach(
      ([k, v]) => (state.user[p.uid].deck.byId[k] = v)
    );
    return { ...state };
  } else if (action.type == 'SHARE_CARD_BULK_INSERT') {
    const p = action.payload;
    if (!state.user[p.uid]) {
      state.user[p.uid] = {
        deck: { byId: {} },
        card: { byId: {} },
      };
    }
    Object.entries(p.card).forEach(
      ([k, v]) => (state.user[p.uid].card.byId[k] = v)
    );
    return { ...state };
  } else if (action.type == 'SHARE_DECK_BULK_DELETE') {
    const p = action.payload;
    const deck_id = p.deck_id;
    if (state.user[p.uid]) {
      delete state.user[p.uid].deck.byId[deck_id];
      const cards = Object.values(state.user[p.uid].card.byId) as Card[];
      const ids = cards.filter(c => c.deck_id === deck_id).map(c => c.id);
      ids.forEach(id => delete state.user[p.uid].card.byId[id]);
    }
    return { ...state };
  } else {
    return state;
  }
};
