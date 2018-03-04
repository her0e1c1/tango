/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as RN from 'react-native';
import { Provider, connect } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { ThemeProvider } from 'styled-components';
import { addNavigationHelpers } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import { LoadingIcon } from 'src/component/utils';
import Root from './component';
import store from './store';
import * as Action from 'src/action';
import * as C from 'src/constant';

class _Theme extends React.Component<ConnectedProps, {}> {
  render() {
    const { state } = this.props;
    const addListener = createReduxBoundAddListener('root');
    const navigation = addNavigationHelpers({
      dispatch: this.props.dispatch as any,
      state: this.props.state.nav,
      addListener,
    });
    return (
      <ThemeProvider theme={Action.config.getTheme(state)}>
        <RN.View style={{ flex: 1 }}>
          <Root navigation={navigation} />
        </RN.View>
      </ThemeProvider>
    );
  }
}
const Theme = connect(state => ({ state }))(_Theme);

const checkUpdate = async (): Promise<boolean> => {
  const v = await RN.AsyncStorage.getItem('version');
  if (v) {
    const int = parseInt(v);
    if (!isNaN(int) && int === C.CURRENT_VERSION) {
      return false;
    }
  }
  return true;
};

const updateIfNeeded = async () => {
  if (await checkUpdate()) {
    await store.dispatch(Action.config.clearAll(true));
    // Set item after clear all otherwise version would also be cleared
    await RN.AsyncStorage.setItem('version', String(C.CURRENT_VERSION));
  }
};

class Main extends React.Component {
  state = { loading: true };
  async componentWillMount() {
    try {
      await updateIfNeeded();
    } finally {
      await this.setState({ loading: false });
    }
  }
  componentDidMount() {
    store.dispatch(Action.auth.init());
  }
  render() {
    if (this.state.loading) {
      return <LoadingIcon />;
    }
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
