import * as Redux from 'redux';
// import { NavigationActions } from 'react-navigation';
import Root from 'src/react-native/component';
import * as _ from 'lodash';
import { uniq } from 'lodash';
import * as type from 'src/action/type';

export const equal = <T>(
  action: Action<any>,
  type: (...args: any[]) => Action<T>
): action is Action<T> => {
  return action.type === type().type;
};

export const deck = (
  state: DeckState = { byId: {}, edit: {} as Deck, categories: [] },
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

export const config = (
  state: ConfigState = {
    showMastered: true,
    showHeader: true,
    showBody: false,
    showHint: false,
    hideBodyWhenCardChanged: true,
    shuffled: false,
    cardInterval: 5,
    start: 0,
    theme: 'default',
    isLoading: false, // maybe not here
    errorCode: undefined,
    cardSwipeUp: 'goToNextCardToggleMastered',
    cardSwipeDown: 'goBack',
    cardSwipeLeft: 'goToPrevCard',
    cardSwipeRight: 'goToNextCard',
    googleAccessToken: undefined,
    googleRefreshToken: undefined,
    uid: '',
  },
  action: Action
): ConfigState => {
  if (equal(action, type.configUpdate)) {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};

const updateCard = (state: CardState, cards: Card[]) => {
  const ns = _.clone(state);
  cards.forEach(c => {
    ns.byId[c.id] = c;
    const ids = ns.byDeckId[c.deckId];
    if (!ids) {
      ns.byDeckId[c.deckId] = [c.id];
    } else if (!ids.includes(c.id)) {
      ns.byDeckId[c.deckId].push(c.id);
    }
  });
  return ns;
};

export const card = (
  state: CardState = { byId: {}, byDeckId: {}, edit: {} as Card },
  action: Action
) => {
  if (equal(action, type.cardBulkInsert)) {
    const cs = action.payload.cards;
    return updateCard(state, cs);
  } else if (equal(action, type.cardBulkDelete)) {
    const deck_id = action.payload.deck_id;
    const ids = state.byDeckId[deck_id];
    ids.forEach(id => delete state.byId[id]);
    delete state.byDeckId[deck_id];
    return { ...state };
  } else if (equal(action, type.cardDelete)) {
    const ns = _.clone(state);
    const c = action.payload.card;
    delete ns.byId[c.id];
    _.pull(ns.byDeckId[c.deckId], c.id);
    return ns;
  } else if (equal(action, type.deckDelete)) {
    const id = action.payload.deckId;
    Object.values(state.byId).forEach(
      c => c.deckId === id && delete state.byId[c.id]
    );
    return state;
  } else if (equal(action, type.card_shuffle)) {
    const config: ConfigState = action.payload.config;
    const byDeckId = Object.entries(state.byDeckId)
      .map(e => ({ [e[0]]: config.shuffled ? _.shuffle(e[1]) : e[1].sort() }))
      .reduce((obj, e) => ({ ...obj, ...e }));
    return { ...state, byDeckId };
  } else if (equal(action, type.card_edit_init)) {
    return { ...state, edit: action.payload.card };
  } else {
    return state;
  }
};

/*
const initialState = Root.router.getStateForAction(
  NavigationActions.init()
  // WARN: some sample code recommends code like this
  // Root.router.getActionForPathAndParams('Main')
  // But in this case, it push a duplicated object to routes
  // it may happen if you use nested routers
);
export const nav = (
  state: NavState = initialState,
  action: Redux.Action
): NavState => {
  const nextState = Root.router.getStateForAction(action, state);
  return nextState || state;
};

const reducers = {
  nav,
  deck,
  card,
  config,
};

export const root = (state, action) => {
  if (equal(action, type.clear_all)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};
*/
