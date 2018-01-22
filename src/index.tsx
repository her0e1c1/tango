/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

import * as Action from 'src/action';
import Root from './component/root';
import View from 'src/component/view';

const reducers = { card: Action.card, deck: Action.deck };

const store = Redux.createStore(
  Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk))
);

export default () => (
  <Provider store={store}>
    <Root />
  </Provider>
);
