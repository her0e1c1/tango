import * as React from 'react';
import { StackNavigator, TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { connect } from 'react-redux';

import Deck from './deck';
import Settings from './settings';

const RootTabs = TabNavigator(
  {
    Deck: {
      screen: Deck,
      navigationOptions: {
        tabBarLabel: 'Deck',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-home' : 'ios-home-outline'}
            size={26}
            style={{ color: tintColor }}
          />
        ),
      },
    },
    Settings: {
      screen: () => Settings,
      navigationOptions: {
        tabBarLabel: 'Settings',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-phone-portrait' : 'ios-phone-portrait-outline'}
            size={26}
            style={{ color: tintColor }}
          />
        ),
      },
    },
  },
  { tabBarPosition: 'bottom', swipeEnabled: false, animationEnabled: true }
);

export default RootTabs;
