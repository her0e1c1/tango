import React from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { ConfigPage } from "src/react-native/container/Config";
import { SpreadSheetListPage } from "./container/SpreadSheetList";
import { DeckPublicListPage } from "./container/DeckPublicList";
import { QRCodePage } from "./container/QRcode";
import { DownloadPage } from "./container/Download";
import { DeckListPage } from "./container/DeckList";
import { DeckSwiperPage } from "./container/DeckSwiper";
import { DeckStartPage } from "./container/DeckStart";
import { DeckEditPage } from "./container/DeckEdit";
import { CardListPage } from "./container/CardList";
import { CardEditPage } from "./container/CardEdit";
import {
  useNavigation,
  useNavigationState,
  useRoute,
} from "@react-navigation/native";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomePage = () => {
  const state = useNavigationState((s) => s);
  const route = useRoute();
  const navi = useNavigation();
  React.useLayoutEffect(() => {
    navi.setOptions({ tabBarVisible: true });
  }, [navi, state, route]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DeckList" component={DeckListPage} />
      <Stack.Screen name="DeckSwiper" component={DeckSwiperPage} />
      <Stack.Screen name="DeckStart" component={DeckStartPage} />
      <Stack.Screen name="DeckEdit" component={DeckEditPage} />
      <Stack.Screen name="CardList" component={CardListPage} />
      <Stack.Screen name="CardEdit" component={CardEditPage} />
    </Stack.Navigator>
  );
};

const Download = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DownloadListMain" component={DownloadPage} />
      <Stack.Screen name="SpreadSheetList" component={SpreadSheetListPage} />
      <Stack.Screen name="DeckPublicList" component={DeckPublicListPage} />
      <Stack.Screen name="QRCode" component={QRCodePage} />
    </Stack.Navigator>
  );
};

export const App = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "Download") {
            iconName = "cloud"
          } else if (route.name === "Config") {
            iconName = "cog"
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: "tomato",
        inactiveTintColor: "gray",
      }}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Download" component={Download} />
      <Tab.Screen name="Config" component={ConfigPage} />
    </Tab.Navigator>
  );
};
