/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

import * as Action from 'src/action';
import Root from './component/root';
import View from 'src/component/view';

const logger = ({ getState, dispatch }) => (next) => (action) => {
  console.log('ACTION: ', action.type);
  const rv = next(action);
  return rv
};

const store = Redux.createStore(
  Redux.combineReducers(Action.reducers),
  Redux.compose(Redux.applyMiddleware(thunk, logger))
);

export default () => (
  <Provider store={store}>
    <Root />
  </Provider>
);
