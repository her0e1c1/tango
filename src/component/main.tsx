import * as RN from 'react-native';
import SearchBar from './searchBar';
import * as React from 'react';
import { CardList } from './card';
import DeckSwiper from './deckSwiper';
import { DeckList } from './deck';
import { Header } from './header';
import { connect } from 'react-redux';
import { Container } from './styled';
import { StackNavigator } from 'react-navigation';
import { CardEdit, CardNew } from './cardEdit';

const wrap = C => () => (
  <Container>
    <Header />
    <C />
  </Container>
);

const Home = ({ state }: { state: RootState }) => (
  <RN.View>
    <SearchBar />
    <RN.View style={{ margin: 5 }} />
    <DeckList />
  </RN.View>
);

export const Root = StackNavigator(
  {
    home: { screen: wrap(connect(state => ({ state }))(Home)) },
    deck: { screen: wrap(CardList) },
    card: { screen: wrap(DeckSwiper) },
    cardNew: { screen: wrap(CardNew) },
    cardEdit: { screen: wrap(CardEdit) },
  } as any,
  { initialRouteName: 'home', navigationOptions: { header: null } }
);

export default Root;
