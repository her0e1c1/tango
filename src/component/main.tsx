import * as RN from 'react-native';
import SearchBar from './searchBar';
import * as React from 'react';
import CardList from './cardList';
import DeckSwiper from './deckSwiper';
import DeckList from './deckList';
import Header from './header';
import { connect } from 'react-redux';
import { Container } from './styled';
import { LoadingIcon } from './utils';
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
    {state.config.isLoading && <LoadingIcon />}
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
  },
  { initialRouteName: 'home', navigationOptions: { header: null } }
);

@connect(state => ({ state }))
class Main extends React.Component<{}, {}> {
  render() {
    const addListener = createReduxBoundAddListener('root');
    const navigation = addNavigationHelpers({
      dispatch: this.props.dispatch,
      state: this.props.state.nav,
      addListener,
    });
    return <Root navigation={navigation} />;
  }
}

export default Main;
