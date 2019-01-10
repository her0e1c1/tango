import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import logger from 'redux-logger';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { deck, card, config, sheet, equal } from 'src/store/reducer';
import * as type from 'src/action/type';

export const history = createHistory();

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['config', 'deck', 'card'],
};

const reducers = combineReducers({
  deck,
  card,
  config,
  sheet,
  router: routerReducer,
});

export const root = (state, action) => {
  if (equal(action, type.clearAll)) {
    state = undefined;
  }
  return reducers(state, action);
};

const persistedReducer = persistReducer(persistConfig, root /*reducers*/);

export const store = createStore(
  persistedReducer,
  __DEV__
    ? applyMiddleware(thunkMiddleware, routerMiddleware(history), logger)
    : applyMiddleware(thunkMiddleware, routerMiddleware(history))
);

export const persistor = persistStore(store);
