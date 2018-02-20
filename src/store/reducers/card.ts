import * as _ from 'lodash';
import * as Redux from 'redux';

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
  state: CardState = { byId: {}, byDeckId: {} },
  action: Redux.Action
) => {
  if (action.type == 'INSERT') {
    const c = action.payload.card;
    return updateCard(state, [c]);
  } else if (action.type == 'BULK_INSERT') {
    const cs = action.payload.cards;
    return updateCard(state, cs);
  } else if (action.type == 'CARD_BULK_DELETE') {
    const deck_id = action.payload.deck.id;
    const ids = state.byDeckId[deck_id];
    ids.forEach(id => delete state.byId[id]);
    delete state.byDeckId[deck_id];
    return { ...state };
  } else if (action.type == 'DELETE') {
    const ns = _.clone(state);
    const c = action.payload.card;
    delete ns.byId[c.id];
    ns.byDeckId = _.pull(ns.byDeckId, c.id);
    return ns;
  } else if (action.type == 'CARD_SHUFFLE') {
    const config: ConfigState = action.payload.config;
    const byDeckId = Object.entries(state.byDeckId)
      .map(e => ({ [e[0]]: config.shuffled ? _.shuffle(e[1]) : e[1].sort() }))
      .reduce((obj, e) => ({ ...obj, ...e }));
    return { ...state, byDeckId };
  } else {
    return state;
  }
};
