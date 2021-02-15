import 'react-native-gesture-handler';
import * as RN from "react-native";
import * as Font from "expo-font";
import React from 'react';
import * as NB from 'native-base';
import store from './src/react-native/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { persistStore } from 'redux-persist';
import { NavigationContainer } from '@react-navigation/native';
import { App } from "src/react-native/App"
import { LoadingIcon } from "src/react-native/component";
import { useConfigAttr } from 'src/hooks/state';
import { useInit } from 'src/react-native/hooks/action';

declare module "react-redux" {
  function useSelector<T>(state: (a: RootState) => T): T;
}

class ErrorBoundary extends React.Component {
  componentDidCatch(error?: Error) {
    // alert('ERROR: ' + error.toString());
  }
  render() {
    return this.props.children;
  }
}

const Init = () => {
  // const init = useInit();
  // const isLoading = useConfigAttr("isLoading");
  const [loadFont, setLoadFont] = React.useState(RN.Platform.OS != "android");
  React.useEffect(() => {
    if (RN.Platform.OS == "android") {
      Font.loadAsync({
        Roboto: require("node_modules/native-base/Fonts/Roboto.ttf"),
        Roboto_medium: require("node_modules/native-base/Fonts/Roboto_medium.ttf"),
        // Ionicons: require('@expo/vector-icons/fonts/Ionicons.ttf'),
      }).then(() => setLoadFont(true));
    }
    // init();
  }, []);
  if (!loadFont) return <LoadingIcon />;
  return (
    <NB.Root>
      <App />
    </NB.Root>
  );
};

export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate loading={<NB.View />} persistor={persistStore(store)}>
        <ErrorBoundary>
          <NavigationContainer>
            <Init />
          </NavigationContainer>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}