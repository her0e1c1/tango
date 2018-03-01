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
import { addNavigationHelpers } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';
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
    home: { screen: wrap(connect(state => ({ state }))(Home)) as any },
    deck: { screen: wrap(CardList) as any },
    card: { screen: wrap(DeckSwiper) as any },
    cardNew: { screen: wrap(CardNew) as any },
    cardEdit: { screen: wrap(CardEdit) as any },
  },
  { initialRouteName: 'home', navigationOptions: { header: null } }
);

class Main extends React.Component<ConnectedProps, {}> {
  render() {
    const addListener = createReduxBoundAddListener('root');
    const navigation = addNavigationHelpers({
      dispatch: this.props.dispatch as any,
      state: this.props.state.nav,
      addListener,
    });
    return <Root navigation={navigation} />;
  }
}

export default connect(state => ({ state }))(Main);
