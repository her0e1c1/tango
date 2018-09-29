import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation';
import CardView from './cardView';
import { SpreadSheetList, Sheet } from './drive';
import { Header } from './header';
import { InputUrl } from './inputUrl';

class _DeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  render() {
    const decks = Selector.getMyDecks(this.props.state);
    return (
      <SD.Container>
        <RN.FlatList
          data={decks.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          onRefresh={async () => {
            await this.props.dispatch(Action.share.fetchDecks());
            await this.setState({ refreshing: false });
          }}
          refreshing={this.state.refreshing}
          ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
          renderItem={({ item }: { item: Deck }) => (
            <RN.TouchableOpacity
              onPress={() =>
                this.props.dispatch(
                  Action.nav.goTo('shareCards', {
                    deck_id: item.id,
                  })
                )
              }
            >
              <SD.DeckCard
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <SD.DeckTitle>{item.name}</SD.DeckTitle>
                <RN.Button
                  title="+"
                  onPress={() =>
                    this.props.dispatch(Action.deck.importFromFireBase(item.id))
                  }
                />
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

// @ts-ignore
const DeckList = connect(state => ({ state }))(_DeckList);

class _CardList extends React.Component<ConnectedProps & { deck_id: number }> {
  componentDidMount() {
    const { deck_id } = this.props;
    this.props.dispatch(Action.share.fetchCardsByDeckId(deck_id));
  }
  render() {
    const { deck_id, dispatch } = this.props;
    const uid = this.props.state.user.uid;
    let cards = [] as Card[];
    const user = this.props.state.share.user[uid];
    if (user && user.card) {
      cards = Object.values(user.card.byId);
    }
    return (
      <SD.Container>
        <RN.FlatList
          data={cards
            .filter(x => !!x && x.deckId === deck_id)
            .map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Card }) => (
            <RN.TouchableOpacity
              onPress={() =>
                dispatch(Action.nav.goTo('shareView', { card: item }))
              }
            >
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.frontText}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
      </SD.Container>
    );
  }
}
const CardList = connect(state => ({ state }))(_CardList);

const _List = props => (
  <NB.List>
    <NB.ListItem onPress={() => props.dispatch(Action.nav.goTo('inputUrl'))}>
      <NB.Left>
        <NB.Title>Input CSV URL (by QR code)</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>

    <NB.ListItem onPress={() => props.dispatch(Action.nav.goTo('spreadsheet'))}>
      <NB.Left>
        <NB.Title>Google Spread Sheet</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>
  </NB.List>
);

const List = connect(state => ({ state }))(_List);

const wrap = C => props => (
  <NB.Container>
    <Header />
    <NB.Content>
      <C {...props.navigation.state.params} />
    </NB.Content>
  </NB.Container>
);

export const Root = StackNavigator(
  {
    share: { screen: wrap(List) },
    sheet: { screen: wrap(Sheet) },
    inputUrl: { screen: InputUrl },
    spreadsheet: { screen: wrap(SpreadSheetList) },
    shareCards: { screen: wrap(CardList) },
    shareView: { screen: wrap(CardView) },
  } as any,
  {
    initialRouteName: 'share',
    navigationOptions: { header: null },
  }
);

export default Root;
