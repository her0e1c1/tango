import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import { NavigationState } from 'react-navigation';
import { root } from './reducer';

const logger = ({ getState, dispatch }) => next => action => {
  __DEV__ && console.log('ACTION: ', action.type);
  const rv = next(action);
  return rv;
};

// NavigationState is a bit different from the one in index.d.ts
// maybe good to just ignore this error
const middleware = createReactNavigationReduxMiddleware<{
  nav: NavigationState;
}>('root', state => state.nav);

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['nav', 'deck', 'card', 'config'],
};

const persistedReducer = persistReducer(
  persistConfig,
  root
  // Redux.combineReducers(reducers)
);

const store = Redux.createStore(
  persistedReducer, // need PersistGate too
  // Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk, logger, middleware))
);

export default store;
