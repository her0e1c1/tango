/// <reference path="../../../" />
import 'react-native-gesture-handler';
import React from 'react';
import * as NB from 'native-base';
import store from './src/react-native/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { persistStore } from 'redux-persist';
import { NavigationContainer } from '@react-navigation/native';
import { App } from "src/react-native/App"

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    // alert('ERROR: ' + error.toString());
  }
  render() {
    return this.props.children;
  }
}

export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate loading={<NB.View />} persistor={persistStore(store)}>
        <ErrorBoundary>
          <NavigationContainer>
            <NB.Root>
              <App />
            </NB.Root>
          </NavigationContainer>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}