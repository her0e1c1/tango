import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardList from './card';
import CardView from './view';
import Header from './header';

const DeckCard = styled(RN.View)`
  padding: 20px;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-width: 0px;
`;

const DeckTitle = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-weight: bold;
  font-size: 20px;
`;

const Container = styled(RN.View)`
  flex: 1;
  background-color: ${({ theme }: AppContext) => theme.mainBackgroundColor};
  padding-top: 20; /* space for ios status bar */
  padding-horizontal: 10px;
`;

@connect((state: RootState) => ({ card: state.card, state }), {
  deleteDeck: Action.deleteDeck,
  insertByURL: Action.insertByURL,
  goTo: Action.goTo,
})
export class DeckItem extends React.Component<
  { deck: Deck; card: CardState },
  {}
> {
  render() {
    const { deck } = this.props;
    const allCardIds = this.props.card.byDeckId[deck.id] || [];
    const mastered = allCardIds
      .map(id => this.props.card.byId[id])
      .filter(x => !!x && x.mastered);
    return (
      <Swipeout
        autoClose
        style={{ marginBottom: 10 }}
        right={[
          {
            text: 'DEL',
            backgroundColor: 'red',
            onPress: () => this.props.deleteDeck(deck),
          },
        ]}
        left={[
          {
            text: 'COPY',
            backgroundColor: 'blue',
            onPress: () => this.props.insertByURL(deck.url),
          },
        ]}
      >
        <RN.TouchableOpacity
          onPress={() => this.props.goTo({ deck: deck })}
          onLongPress={() => alert(JSON.stringify(deck))}
        >
          <DeckCard>
            <DeckTitle>{deck.name}</DeckTitle>
            <RN.Text>
              {mastered.length} of {allCardIds.length} cards mastered
            </RN.Text>
            <RN.View
              style={{ height: 20, marginTop: 10, backgroundColor: 'silver' }}
            >
              <RN.View
                style={{
                  height: 20,
                  width: mastered.length / allCardIds.length * 100,
                  backgroundColor: 'green',
                }}
              />
            </RN.View>
          </DeckCard>
        </RN.TouchableOpacity>
      </Swipeout>
    );
  }
}

@connect((state: RootState) => ({ decks: Object.values(state.deck) }), {
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
})
export class DeckList extends React.Component<{}, { refreshing: boolean }> {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }
  render() {
    return (
      <RN.FlatList
        data={this.props.decks.map(d => ({ ...d, key: d.id }))}
        renderItem={({ item }) => <DeckItem deck={item} />}
        onRefresh={async () => {
          // TODO: fix later
          await this.props.selectDeck();
          await this.props.selectCard();
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
      />
    );
  }
}

@connect((state: RootState) => ({ nav: state.nav, state }), {
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
})
export default class Home extends React.Component<{}, {}> {
  async componentDidMount() {
    await this.props.selectDeck();
    await this.props.selectCard();
  }
  render() {
    const { nav } = this.props;
    return (
      <Container>
        <Header />
        {nav.deck && nav.index !== undefined && <CardView />}
        {nav.deck && nav.index == undefined && <CardList />}
        {!nav.deck && <DeckList />}
      </Container>
    );
  }
}
