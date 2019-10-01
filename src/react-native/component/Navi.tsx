import * as React from 'react';
import * as NB from 'native-base';
import {
  createBottomTabNavigator,
  createAppContainer,
  createStackNavigator,
} from 'react-navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntIcon from 'react-native-vector-icons/AntDesign';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from './Common';

export const Header = (props: {
  left?: { onPress?: Callback };
  body?: { title: string; onPress?: Callback };
  right?: { icon: string; onPress?: Callback };
}) => (
  <NB.Header>
    {props.left ? (
      <NB.Left>
        <NB.Button transparent onPress={props.left.onPress}>
          <NB.Icon name="arrow-back" />
        </NB.Button>
      </NB.Left>
    ) : (
      <NB.Left />
    )}
    {props.body ? (
      <NB.Body>
        <TouchableOpacity onPress={props.body.onPress}>
          <NB.Title>{props.body.title}</NB.Title>
        </TouchableOpacity>
      </NB.Body>
    ) : (
      <NB.Body />
    )}
    {props.right ? (
      <NB.Right>
        <NB.Button transparent onPress={props.right.onPress}>
          <Icon name={props.right.icon} size={20} />
        </NB.Button>
      </NB.Right>
    ) : (
      <NB.Right />
    )}
  </NB.Header>
);

const iconName = {
  Home: 'home',
  Download: 'download',
  Config: 'setting',
};

// swipeEnabled: false,
// animationEnabled: true,

export const createStackNavi = (props: {
  CardList: any;
  DeckList: any;
  DeckSwiper: any;
  DeckStart: any;
  DeckEdit: any;
  CardEdit: any;
}) =>
  createStackNavigator(
    {
      CardList: props.CardList,
      DeckList: props.DeckList,
      DeckSwiper: props.DeckSwiper,
      DeckStart: props.DeckStart,
      DeckEdit: props.DeckEdit,
      CardEdit: props.CardEdit,
    },
    { initialRouteName: 'DeckList', headerMode: 'none' }
  );

export const createDownloadNavi = (props: {
  Download: any;
  SpreadSheetList: any;
  DeckPublicList: any;
  QRCode: any;
}) =>
  createStackNavigator(
    {
      Download: props.Download,
      SpreadSheetList: props.SpreadSheetList,
      DeckPublicList: props.DeckPublicList,
      QRCode: props.QRCode,
    },
    { initialRouteName: 'Download', headerMode: 'none' }
  );

export const createNavi = (props: {
  Home: any;
  Download: any;
  Config: any;
  visible?: boolean;
}) =>
  createAppContainer(
    createBottomTabNavigator(
      {
        Home: props.Home,
        Download: props.Download,
        Config: props.Config,
      },
      {
        defaultNavigationOptions: ({ navigation }) => {
          const tabBarVisible =
            navigation.state.index == 0 ||
            navigation.state.routeName !== 'Home';
          return {
            tabBarVisible,
            tabBarIcon: ({ focused, tintColor }) => {
              const { routeName } = navigation.state;
              return (
                <AntIcon
                  name={
                    focused ? iconName[routeName] : iconName[routeName] // + '-outline'
                  }
                  size={25}
                  style={{ color: tintColor }}
                />
              );
            },
            tabBarOptions: {
              showLabel: false,
              labelStyle: {
                fontSize: 12,
              },
            },
          };
        },
      }
    )
  );

// const A = createBottomTabNavigator(
//   {},
//   {
//     defaultNavigationOptions: ({ navigation }) => ({
//       // tabBarVisible: navigation.state.routeName === "",
//       tabBarIcon: ({ focused, horizontal, tintColor }) => {
//         const { routeName } = navigation.state;
//         return (
//           <AntIcon
//             name={
//               focused ? iconName[routeName] : iconName[routeName] // + '-outline'
//             }
//             size={25}
//             style={{ color: tintColor }}
//           />
//         );
//       },
//       tabBarOptions: {
//         showLabel: false,
//         labelStyle: {
//           fontSize: 12,
//         },
//       },
//     }),
//   }
// );
