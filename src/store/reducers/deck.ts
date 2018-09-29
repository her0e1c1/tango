import { uniq } from 'lodash';
import * as type from 'src/action/type';
import { equal } from './util';

export default (
  state: DeckState = { byId: {}, edit: {} as Deck },
  action: Action
) => {
  if (equal(action, type.deckBulkInsert)) {
    const decks = action.payload.decks;
    decks.forEach(d => {
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
    return {
      ...state,
      categories: uniq(decks.map(c => c.category)).filter(c => !!c),
    };
    // } else if (equal(action, type.deckDelete)) {
    //   const id = action.payload.deckId;
    //   delete state.byId[id];
    //   return state;
  } else if (equal(action, type.deckBulkDelete)) {
    action.payload.deckIds.forEach(id => delete state.byId[id]);
    return { ...state };
  } else {
    return state;
  }
};
