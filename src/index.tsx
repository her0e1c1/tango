import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import * as Action from 'src/action';
import Root from './container/root';

const reducers = { card: Action.card };

const store = Redux.createStore(
  Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk))
);

export default () => (
  <Provider store={store}>
    <Root />
  </Provider>
);
