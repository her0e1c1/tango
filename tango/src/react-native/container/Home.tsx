import React from 'react';
import { DeckListPage } from './DeckList';
import { CardListPage } from './CardList';
import { DeckSwiperPage } from './DeckSwiper';
import { DeckStartPage } from './DeckStart';
import { DeckEditPage } from './DeckEdit';
import { CardEditPage } from './CardEdit';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export const HomePage = () => {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false
    }}
    >
      <Stack.Screen name="DeckList" component={DeckListPage} />
      <Stack.Screen name="DeckSwiper" component={DeckSwiperPage} />
      <Stack.Screen name="DeckStart" component={DeckStartPage} />
      <Stack.Screen name="DeckEdit" component={DeckEditPage} />
      <Stack.Screen name="CardList" component={CardListPage} />
      <Stack.Screen name="CardEdit" component={CardEditPage} />
    </Stack.Navigator>
  )
}