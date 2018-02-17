import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as I from 'src/interface';
import * as SD from './styled';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation';
import { withNavigation } from 'react-navigation';
import CardView from './cardView';

@withNavigation
@connect(state => ({ state }))
class DeckList extends React.Component<{ state: RootState }, {}> {
  componentDidMount() {
    this.props.dispatch(Action.share.fetchDecks());
  }
  render() {
    const decks = Selector.getMyDecks(this.props.state);
    return (
      <SD.Container>
        <RN.FlatList
          data={decks.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Deck }) => (
            <RN.TouchableOpacity
              onPress={() =>
                this.props.navigation.navigate('shareCards', { deck: item })
              }
            >
              <SD.DeckCard
                style={{
                  marginBottom: 10,
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <SD.DeckTitle>{item.name}</SD.DeckTitle>
                <RN.Button
                  title="DEL"
                  onPress={() =>
                    this.props.dispatch(Action.share.deleteDeck(item.id))
                  }
                />
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
    );
  }
}

@withNavigation
@connect(state => ({ state }))
class CardList extends React.Component<{ state: RootState } & { deck: Deck }> {
  componentDidMount() {
    const { deck } = this.props.navigation.state.params;
    this.props.dispatch(Action.share.fetchCardsByDeckId(deck.id));
  }
  render() {
    const { deck } = this.props.navigation.state.params;
    const uid = this.props.state.user.uid;
    const cards = Object.values(this.props.state.share.user[uid].card.byId);
    return (
      <SD.Container>
        <RN.FlatList
          data={cards
            .filter(x => !!x && x.deck_id === deck.id)
            .map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Card }) => (
            <RN.TouchableOpacity
              onPress={() =>
                this.props.navigation.navigate('shareView', { card: item })
              }
            >
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.name}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
    );
  }
}

const ShareView = props => (
  <SD.Container>
    <CardView card={props.navigation.state.params.card} />
  </SD.Container>
);

export const Root = StackNavigator(
  {
    share: { screen: DeckList },
    shareCards: { screen: CardList },
    shareView: { screen: withNavigation(ShareView) },
  },
  { initialRouteName: 'share', navigationOptions: { header: null } }
);

export default Root;
