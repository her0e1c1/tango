import * as type from 'src/action/type';
import { equal } from './util';

export default (state: ShareState = { user: {} }, action: Action) => {
  if (equal(action, type.share_deck_bulk_insert)) {
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
  } else if (equal(action, type.share_card_bulk_insert)) {
    const p = action.payload;
    if (!state.user[p.uid]) {
      state.user[p.uid] = {
        deck: { byId: {} },
        card: { byId: {} },
      };
    }
    Object.entries(p.cards).forEach(
      ([k, v]) => (state.user[p.uid].card.byId[k] = v)
    );
    return { ...state };
  } else if (equal(action, type.share_deck_bulk_delete)) {
    const p = action.payload;
    const deck_id = p.deck_id;
    if (state.user[p.uid]) {
      delete state.user[p.uid].deck.byId[deck_id];
      const cards = Object.values(state.user[p.uid].card.byId);
      const ids = cards.filter(c => c.deck_id === deck_id).map(c => c.id);
      ids.forEach(id => delete state.user[p.uid].card.byId[id]);
    }
    return { ...state };
  } else {
    return state;
  }
};
