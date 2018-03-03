import * as type from 'src/action/type';
import { equal } from './util';

export default (state: DeckState = { byId: {} }, action: Action) => {
  if (equal(action, type.deck_bulk_insert)) {
    action.payload.decks.forEach(d => (state.byId[d.id] = d));
    return { ...state };
  } else if (equal(action, type.deck_bulk_delete)) {
    action.payload.decks.forEach(d => delete state.byId[d.id]);
    return { ...state };
  } else {
    return state;
  }
};
