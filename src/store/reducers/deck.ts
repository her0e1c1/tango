import * as Redux from 'redux';

export default (state: DeckState = { byId: {} }, action: Redux.Action) => {
  if (action.type == 'DECK_INSERT') {
    const d: Deck = action.payload.deck;
    state.byId[d.id] = d;
    return { ...state };
  } else if (action.type == 'DECK_BULK_INSERT') {
    action.payload.decks.forEach(d => (state.byId[d.id] = d));
    return { ...state };
  } else if (action.type == 'DECK_DELETE') {
    const d: Deck = action.payload.deck;
    delete state.byId[d.id];
    return { ...state };
  } else {
    return state;
  }
};
