/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ThemeProvider } from 'styled-components';
import { connect } from 'react-redux';

import * as Action from 'src/action';
import Root from './component';

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

const persistedReducer = persistReducer(
  persistConfig,
  Redux.combineReducers(Action.reducers)
);

const store = Redux.createStore(
  persistedReducer,
  // Redux.combineReducers(Action.reducers),
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);
const persistor = persistStore(store);

@connect((state: RootState) => ({ state }), {})
class Wrap extends React.Component {
  render() {
    return (
      <ThemeProvider theme={Action.getTheme(this.props.state)}>
        <Root />
      </ThemeProvider>
    );
  }
}

export default () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Wrap />
    </PersistGate>
  </Provider>
);
