/// <reference path="../../../" />
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as RN from 'react-native';
import * as NB from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import store from './src/react-native/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';

import { persistStore } from 'redux-persist';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ConfigPage } from "src/react-native/container/Config"
import { HomePage } from "src/react-native/container/Home"
import { DownloadPage } from "src/react-native/container/Download"

const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    // alert('ERROR: ' + error.toString());
  }
  render() {
    return this.props.children;
  }
}

const App: React.FC = props => {
  return <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = focused
            ? 'ios-information-circle'
            : 'ios-information-circle-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'ios-list-box' : 'ios-list';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: 'tomato',
      inactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen name="Home" component={HomePage} />
    <Tab.Screen name="Download" component={DownloadPage} />
    <Tab.Screen name="Config" component={ConfigPage} />
  </Tab.Navigator>
}

export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate loading={<View />} persistor={persistStore(store)}>
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