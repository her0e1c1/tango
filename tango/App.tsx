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
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ConfigPage } from "src/react-native/container/Config"

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const HomeScreen = () => (
  <View style={styles.container}>
    <Text>Open up App.tsx to start working on your app</Text>
  </View>
);

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    // alert('ERROR: ' + error.toString());
  }
  render() {
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<View />} persistor={persistStore(store)}>
          <NB.Root>
            <NavigationContainer>
              <Tab.Navigator
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
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Config" component={ConfigPage} />
                {/* <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator> */}
              </Tab.Navigator>
            </NavigationContainer>
          </NB.Root>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});