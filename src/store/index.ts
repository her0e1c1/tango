import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import reducers from './reducers';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import { NavigationState } from 'react-navigation';
import * as type from 'src/action/type';
import { equal } from './reducers/util';

const logger = ({ getState, dispatch }) => next => action => {
  console.log('ACTION: ', action.type);
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
  // blacklist: ['share', 'drive', 'nav'],
  whitelist: ['nav'],
};

const rootReducer = (state, action) => {
  if (equal(action, type.clear_all)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
  // Redux.combineReducers(reducers)
);

const store = Redux.createStore(
  persistedReducer, // need PersistGate too
  // Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk, logger, middleware))
);

export default store;
