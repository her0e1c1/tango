import * as type from 'src/action/type';
import { equal } from './util';

export default (
  state: DeckState = { byId: {}, edit: {} as Deck },
  action: Action
) => {
  if (equal(action, type.deck_bulk_insert)) {
    action.payload.decks.forEach(d => {
      // HOTFIX: some deck returns without id
      if (!d.id) return;
      let currentIndex = d.currentIndex;
      if (currentIndex === undefined) {
        const deck = state.byId[d.id];
        if (deck) {
          if (deck.currentIndex === undefined) {
            currentIndex = 0;
          } else {
            currentIndex = deck.currentIndex;
          }
        } else {
          currentIndex = 0;
        }
      }
      state.byId[d.id] = { ...d, currentIndex };
    });
    return { ...state };
  } else if (equal(action, type.deck_bulk_delete)) {
    action.payload.decks.forEach(d => delete state.byId[d.id]);
    return { ...state };
  } else if (equal(action, type.deck_edit)) {
    const edit = Object.assign(state.edit || {}, action.payload.deck);
    return { ...state, edit };
  } else {
    return state;
  }
};
