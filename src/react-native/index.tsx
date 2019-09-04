/// <reference path="../../index.d.ts" />

import * as React from 'react';
// import * as RN from 'react-native';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { useConfigAttr } from 'src/hooks/state';
import * as NB from 'native-base';

import { Navi } from './container';
import { LoadingIcon } from './component';
import store from './store';
import { useInit } from './hooks/action';

declare module 'react-redux' {
  function useSelector<T>(state: (a: RootState) => T): T;
}

const Main = () => {
  const init = useInit();
  const isLoading = useConfigAttr('isLoading');
  // const isLoadingNoAction = useConfigAttr('isLoadingNoAction');
  React.useEffect(() => {
    // if (RN.Platform.OS == 'android') {
    //   Expo.Font.loadAsync({
    //     Roboto: require('native-base/Fonts/Roboto.ttf'),
    //     Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
    //     Ionicons: require('@expo/vector-icons/fonts/Ionicons.ttf'),
    //   });
    // }
    init();
  }, []);
  return (
    <NB.Root>
      {isLoading && <LoadingIcon /*isLoadingNoAction={isLoadingNoAction} */ />}
      <Navi />
    </NB.Root>
  );
};

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    alert('ERROR: ' + error.toString());
    // store.dispatch(Action.clearAll(true));
  }
  render() {
    return this.props.children;
  }
}

export default () => (
  <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={<LoadingIcon />} persistor={persistStore(store)}>
        <Main />
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);
