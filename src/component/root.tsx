import * as React from 'react';
import { StackNavigator, TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { connect } from 'react-redux';

import Deck from './deck';
import Settings from './settings';
import Help from './help';

const RootTabs = TabNavigator(
  {
    Deck: {
      screen: Deck,
      navigationOptions: {
        tabBarLabel: 'Decks',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'cards' : 'cards-outline'}
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
    Help: {
      screen: Help,
      navigationOptions: {
        tabBarLabel: 'Help',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-help-circle' : 'ios-help-circle-outline'}
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
