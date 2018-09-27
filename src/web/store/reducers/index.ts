import { uniq } from 'lodash';
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { routerReducer } from 'react-router-redux';

import * as type from 'src/action/type';

export const equal = <T>(
  action: Action<any>,
  type: (...args: any[]) => Action<T>
): action is Action<T> => {
  return action.type === type().type;
};

const defaultDeckState: DeckState = {
  byId: {},
  categories: [],
};
const defaultCardState: CardState = {
  byId: {},
};
const defaultConfigState: ConfigState = {
  uid: '',
  googleAccessToken: '',
};

const deck = (state: DeckState = defaultDeckState, action: Action) => {
  if (equal(action, type.deckBulkInsert)) {
    const decks = action.payload.decks;
    decks.forEach(d => (state.byId[d.id] = d));
    return {
      ...state,
      categories: uniq(decks.map(c => c.category)).filter(c => !!c),
    };
  } else if (equal(action, type.deckDelete)) {
    const id = action.payload.deckId;
    delete state.byId[id];
    return state;
  } else {
    return state;
  }
};

const card = (state: CardState = defaultCardState, action: Action) => {
  if (equal(action, type.cardBulkInsert)) {
    action.payload.cards.forEach(c => (state.byId[c.id] = c));
    return state;
  } else if (equal(action, type.deckDelete)) {
    const id = action.payload.deckId;
    Object.values(state.byId).forEach(
      c => c.deckId === id && delete state.byId[c.id]
    );
    return state;
  } else if (equal(action, type.cardDelete)) {
    const id = action.payload.id;
    delete state.byId[id];
    return state;
  } else {
    return state;
  }
};

const config = (state: ConfigState = defaultConfigState, action: Action) => {
  if (equal(action, type.configUpdate)) {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['config'],
};

const reducers = combineReducers({
  deck,
  card,
  config,
  router: routerReducer,
});

const persistedReducer = persistReducer(persistConfig, reducers);

export default persistedReducer;
