
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConfigPage } from "src/react-native/container/Config"
import { HomePage } from "src/react-native/container/Home"
// import { DownloadPage } from "src/react-native/container/Download"
import { createStackNavigator } from '@react-navigation/stack';
import { SpreadSheetListPage } from './container/SpreadSheetList';
import { DeckPublicListPage } from './container/DeckPublicList';
import { QRCodePage } from './container/QRcode';
import { DownloadPage } from './container/Download';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const Download = () => {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false
        }}
        >
            <Stack.Screen name="DownloadListMain" component={DownloadPage} />
            <Stack.Screen name="SpreadSheetList" component={SpreadSheetListPage} />
            <Stack.Screen name="DeckPublicList" component={DeckPublicListPage} />
            <Stack.Screen name="QRCode" component={QRCodePage} />
        </Stack.Navigator>
    )
}

export const App: React.FC = props => {
    return (
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
            <Tab.Screen name="Home" component={HomePage} />
            <Tab.Screen name="Download" component={Download} />
            <Tab.Screen name="Config" component={ConfigPage} />
        </Tab.Navigator>);
}