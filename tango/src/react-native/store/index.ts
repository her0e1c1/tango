import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import { root } from './reducer';

const logger = () => next => action => {
  __DEV__ && console.log('ACTION: ', action.type);
  const rv = next(action);
  return rv;
};

// NavigationState is a bit different from the one in index.d.ts
// maybe good to just ignore this error
// const middleware = createReactNavigationReduxMiddleware<{
//   nav: NavigationState;
// }>('root', state => state.nav);

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
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
  // Redux.compose(Redux.applyMiddleware(thunk, logger, middleware))
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);

export default store;
