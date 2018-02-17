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
  } else {
    return state;
  }
};
