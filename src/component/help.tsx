import * as Action from 'src/action';
import * as Selector from 'src/selector';
import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import { connect } from 'react-redux';
import { StackNavigator } from 'react-navigation';
import { withNavigation } from 'react-navigation';
import { LoadingIcon } from './utils';
import CardView from './cardView';
import { DriveList } from './drive';

class _DeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  render() {
    const decks = Selector.getMyDecks(this.props.state);
    return (
      <SD.Container>
        {this.props.state.config.isLoading && <LoadingIcon />}
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
const DeckList = connect(state => ({ state }))(_DeckList);

class _CardList extends React.Component<ConnectedProps & { deck_id: number }> {
  componentDidMount() {
    const { deck_id } = this.props;
    this.props.dispatch(Action.share.fetchCardsByDeckId(deck_id));
  }
  render() {
    const { deck_id, dispatch } = this.props;
    const cards = [] as Card[]; // Object.values(this.props.state.share.user[uid].card.byId);
    // const uid = this.props.state.user.uid;
    //const cards = Object.values(this.props.state.share.user[uid].card.byId);
    return (
      <SD.Container>
        <RN.FlatList
          data={cards
            .filter(x => !!x && x.deck_id === deck_id)
            .map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Card }) => (
            <RN.TouchableOpacity
              onPress={() =>
                dispatch(Action.nav.goTo('shareView', { card: item }))
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
const CardList = connect(state => ({ state }))(_CardList);

const ShareView = props => (
  <SD.Container>
    <CardView card={props.navigation.state.params.card} />
  </SD.Container>
);

const List = () => (
  <RN.View style={{ flex: 1 }}>
    <DriveList />
    <DeckList />
  </RN.View>
);

export const Root = StackNavigator(
  {
    share: { screen: List },
    shareCards: {
      screen: withNavigation(({ navigation }: any) => (
        <CardList deck_id={navigation.state.params.deck_id} />
      )),
    },
    shareView: { screen: withNavigation(ShareView) },
  } as any,
  {
    initialRouteName: 'share',
    navigationOptions: { header: null },
  }
);

export default Root;
