/// <reference path="./index.d.ts" />

import * as React from 'react';
import { Provider, connect } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ThemeProvider } from 'styled-components';

import { LoadingIcon } from 'src/component/utils';
import RootTabs from './component';
import store from './store';
import * as Action from 'src/action';

const Theme = connect(state => ({ state }))(({ state }) => (
  <ThemeProvider theme={Action.getTheme(state as RootState)}>
    <RootTabs />
  </ThemeProvider>
));

class Main extends React.Component {
  componentDidMount() {
    store.dispatch(Action.auth.init());
    store.dispatch(Action.checkVersion(3));
  }
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={<LoadingIcon />} persistor={persistStore(store)}>
          <Theme />
        </PersistGate>
      </Provider>
    );
  }
}
export default Main;
