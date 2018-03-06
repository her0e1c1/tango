import * as React from 'react';
import { TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Main from './main';
import { Settings } from './settings';
import Cloud from './cloud';
import * as SD from './styled';

const RootTabs = TabNavigator(
  {
    Main: {
      screen: Main,
      navigationOptions: ({ navigation }) => {
        const r = navigation.state.routes;
        return {
          tabBarLabel: 'Decks',
          tabBarVisible: r.length === 1,
          tabBarIcon: ({ tintColor, focused }) => (
            <Ionicons
              name={focused ? 'ios-card' : 'ios-card-outline'}
              size={26}
              style={{ color: tintColor }}
            />
          ),
        };
      },
    },
    Cloud: {
      screen: Cloud,
      navigationOptions: {
        tabBarLabel: 'Cloud',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-cloud' : 'ios-cloud-outline'}
            size={26}
            style={{ color: tintColor }}
          />
        ),
      },
    },
    Settings: {
      screen: Settings,
      navigationOptions: {
        tabBarLabel: 'Settings',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-settings' : 'ios-settings-outline'}
            size={26}
            style={{ color: tintColor }}
          />
        ),
      },
    },
  },
  {
    tabBarComponent: SD.TabBarBottom,
    tabBarPosition: 'bottom',
    swipeEnabled: false,
    animationEnabled: true,
    tabBarOptions: {
      // activeTintColor: 'blue',
      labelStyle: {
        fontSize: 12,
      },
    },
  }
);

export default RootTabs;
