import * as React from 'react';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation';
import * as RN from 'react-native';

import * as Action from 'src/react-native/action';
import { Header } from './header';
import { InputUrl } from './inputUrl';
import * as Selector from 'src/selector';

class _PublicDeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  componentDidMount() {
    this.props.dispatch(Action.deckFetch(true));
  }
  render() {
    const decks = Selector.getDecks(this.props.state, true);
    return (
      <RN.FlatList
        data={decks.map((d, key) => ({ ...d, key }))}
        onRefresh={async () => {
          // await this.props.dispatch(Action.share.fetchDecks());
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
        renderItem={({ item }: { item: Deck }) => (
          <RN.TouchableOpacity
            onPress={() =>
              this.props.dispatch(
                Action.goTo('shareCards', {
                  deck_id: item.id,
                })
              )
            }
          >
            <NB.ListItem>
              <NB.Left>
                <NB.Title>{item.name}</NB.Title>
              </NB.Left>
              <NB.Right>
                <NB.Icon
                  name="md-add"
                  onPress={() =>
                    this.props.dispatch(Action.deckImportPublic(item.id))
                  }
                />
              </NB.Right>
            </NB.ListItem>
          </RN.TouchableOpacity>
        )}
      />
    );
  }
}

const PublicDeckList = connect(state => ({ state }))(_PublicDeckList);
/*
class _CardList extends React.Component<ConnectedProps & { deck_id: string }> {
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
              onPress={() => dispatch(Action.goTo('shareView', { card: item }))}
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
*/

const _List = props => (
  <NB.List>
    <NB.ListItem onPress={() => props.dispatch(Action.goTo('inputUrl'))}>
      <NB.Left>
        <NB.Title>Input CSV URL (by QR code)</NB.Title>
      </NB.Left>
      <NB.Right>
        <NB.Icon active name="arrow-forward" />
      </NB.Right>
    </NB.ListItem>
    <NB.ListItem onPress={() => props.dispatch(Action.goTo('publicDeckList'))}>
      <NB.Left>
        <NB.Title>Public Deck List</NB.Title>
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
    inputUrl: { screen: InputUrl },
    publicDeckList: { screen: wrap(PublicDeckList) },
    // shareCards: { screen: wrap(CardList) },
    // sheet: { screen: wrap(Sheet) },
    // spreadsheet: { screen: wrap(SpreadSheetList) },
    // shareView: { screen: wrap(CardView) },
  } as any,
  {
    initialRouteName: 'share',
    navigationOptions: { header: null },
  }
);

export default Root;
