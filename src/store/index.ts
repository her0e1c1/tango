import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import reducers from './reducers';

const logger = ({ getState, dispatch }) => next => action => {
  console.log('ACTION: ', action.type);
  const rv = next(action);
  return rv;
};

const persistConfig = {
  key: 'root',
  storage: storage,
  // whitelist: [],
  // whitelist: ['nav'],
};

const rootReducer = (state, action) => {
  if (action.type == 'CLEAR_ALL') {
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
  persistedReducer,
  // Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);

export default store;
