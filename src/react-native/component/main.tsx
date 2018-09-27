import * as NB from 'native-base';
import * as React from 'react';
import { CardList } from './card';
import DeckSwiper from './deckSwiper';
import { DeckList, DeckEdit } from './deck';
import { Header } from './header';
import { StackNavigator } from 'react-navigation';
import { CardEdit, CardNew } from './cardEdit';

const wrap = C => props => (
  <NB.Container>
    <Header />
    <C {...props.navigation.state.params} />
  </NB.Container>
);

export const Root = StackNavigator(
  {
    home: { screen: wrap(DeckList) },
    deck: { screen: wrap(CardList) },
    card: { screen: wrap(DeckSwiper) },
    deckEdit: { screen: wrap(DeckEdit) },
    cardNew: { screen: wrap(CardNew) },
    cardEdit: { screen: wrap(CardEdit) },
  } as any,
  { initialRouteName: 'home', navigationOptions: { header: null } }
);

export default Root;
