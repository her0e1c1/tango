import * as React from 'react';
import { TabNavigator, TabBarBottom } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { withTheme } from 'styled-components';

import Main from './main';
import Settings from './settings';
import Help from './help';

const RootTabs = TabNavigator(
  {
    Main: {
      screen: Main,
      navigationOptions: {
        tabBarLabel: 'Decks',
        tabBarIcon: ({ tintColor, focused }) => (
          <Ionicons
            name={focused ? 'ios-card' : 'ios-card-outline'}
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
  {
    tabBarComponent: withTheme((props: AppContext) => {
      return (
        <TabBarBottom
          {...{
            ...props,
            style: { backgroundColor: props.theme.cardBackgroundColor },
          }}
        />
      );
    }),
    tabBarPosition: 'bottom',
    swipeEnabled: false,
    animationEnabled: true,
    tabBarOptions: {
      // activeTintColor: 'blue',
      labelStyle: {
        fontSize: 12,
      },
      style: {
        backgroundColor: 'white',
      },
    },
  }
);

export default RootTabs;
