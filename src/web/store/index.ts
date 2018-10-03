import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import logger from 'redux-logger';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { deck, card, config } from 'src/store/reducer';

export const history = createHistory();

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

export const store = createStore(
  persistedReducer,
  __DEV__
    ? applyMiddleware(thunkMiddleware, routerMiddleware(history), logger)
    : applyMiddleware(thunkMiddleware, routerMiddleware(history))
);

export const persistor = persistStore(store);
