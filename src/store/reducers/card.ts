import * as _ from 'lodash';
import * as type from 'src/action/type';
import { equal } from './util';

const updateCard = (state: CardState, cards: Card[]) => {
  const ns = _.clone(state);
  cards.forEach(c => {
    c.category === undefined && (c.category = null); // firebase can not store undefined ...
    ns.byId[c.id] = c;
    const ids = ns.byDeckId[c.deck_id];
    if (!ids) {
      ns.byDeckId[c.deck_id] = [c.id];
    } else if (!ids.includes(c.id)) {
      ns.byDeckId[c.deck_id].push(c.id);
    }
  });
  return ns;
};

export default (
  state: CardState = { byId: {}, byDeckId: {}, edit: {} as Card },
  action: Action
) => {
  if (equal(action, type.card_bulk_insert)) {
    const cs = action.payload.cards;
    return updateCard(state, cs);
  } else if (equal(action, type.card_bulk_delete)) {
    const deck_id = action.payload.deck_id;
    const ids = state.byDeckId[deck_id];
    ids.forEach(id => delete state.byId[id]);
    delete state.byDeckId[deck_id];
    return { ...state };
  } else if (equal(action, type.card_delete)) {
    const ns = _.clone(state);
    const c = action.payload.card;
    delete ns.byId[c.id];
    _.pull(ns.byDeckId[c.deck_id], c.id);
    return ns;
  } else if (equal(action, type.card_shuffle)) {
    const config: ConfigState = action.payload.config;
    const byDeckId = Object.entries(state.byDeckId)
      .map(e => ({ [e[0]]: config.shuffled ? _.shuffle(e[1]) : e[1].sort() }))
      .reduce((obj, e) => ({ ...obj, ...e }));
    return { ...state, byDeckId };
  } else if (equal(action, type.card_edit_init)) {
    return { ...state, edit: action.payload.card };
  } else if (equal(action, type.card_edit)) {
    const edit = Object.assign(state.edit || {}, action.payload.card);
    return { ...state, edit };
  } else {
    return state;
  }
};
