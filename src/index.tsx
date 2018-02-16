/// <reference path="./index.d.ts" />

import * as React from 'react';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ThemeProvider } from 'styled-components';
import { connect } from 'react-redux';

import RootTabs from './component';
import store from './store';
import * as Action from 'src/action';

@connect((state: RootState) => ({ state }))
class Wrap extends React.Component {
  componentDidMount() {
    store.dispatch(Action.auth.init());
    store.dispatch(Action.checkVersion(3));
  }
  render() {
    return (
      <ThemeProvider theme={Action.getTheme(this.props.state)}>
        <RootTabs />
      </ThemeProvider>
    );
  }
}

export default () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistStore(store)}>
      <Wrap />
    </PersistGate>
  </Provider>
);
