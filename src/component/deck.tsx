import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as Selector from 'src/selector';

export class _DeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { refreshing: false };
  }
  async componentDidMount() {
    const { dispatch } = this.props;
    await dispatch(Action.deck.select());
    await dispatch(Action.card.selectCard());
  }
  getLeftItems(deck: Deck) {
    const { dispatch } = this.props;
    const { uid } = this.props.state.user;
    const items = [
      {
        text: 'LIST',
        backgroundColor: 'darkgreen',
        onPress: () => dispatch(Action.nav.goTo('deck', { deck_id: deck.id })),
      },
      {
        text: 'COPY',
        backgroundColor: 'blue',
        onPress: () =>
          deck.url
            ? dispatch(Action.deck.insertByURL(deck.url))
            : alert('NO URL :('),
      },
    ];
    if (uid) {
      items.push({
        text: 'UP',
        backgroundColor: 'green',
        onPress: () => dispatch(Action.deck.upload(deck)),
      });
      items.push({
        text: 'DRIVE',
        backgroundColor: 'skyblue',
        onPress: () => dispatch(Action.drive.upload(deck)),
      });
    }
    return items;
  }

  render() {
    const decks = Object.values(this.props.state.deck.byId);
    const { dispatch } = this.props;
    return (
      <RN.FlatList
        data={decks.map(d => ({ ...d, key: d.id }))}
        onRefresh={async () => {
          await dispatch(Action.deck.select());
          await dispatch(Action.card.selectCard());
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
        renderItem={({ item }: { item: Deck }) => {
          return (
            <NB.SwipeRow
              key={item.id}
              leftOpenValue={50}
              rightOpenValue={-50}
              swipeToOpenPercent={30}
              directionalDistanceChangeThreshold={2}
              {...{
                left: (
                  <NB.Button
                    primary
                    onPress={() =>
                      dispatch(Action.nav.goTo('deck', { deck_id: item.id }))
                    }
                  >
                    <NB.Icon active name="list" />
                  </NB.Button>
                ),
                right: (
                  <NB.Button
                    danger
                    onPress={() => dispatch(Action.deck.remove(item))}
                  >
                    <NB.Icon active name="trash" />
                  </NB.Button>
                ),
                body: (
                  <RN.TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      dispatch(Action.nav.goTo('card', { deck_id: item.id }));
                    }}
                    onLongPress={() => alert(JSON.stringify(item))}
                  >
                    <NB.Title>{item.name}</NB.Title>
                    {/* <ProgressBar deck_id={item && item.id} /> */}
                  </RN.TouchableOpacity>
                ),
              }}
            />
          );
        }}
      />
    );
  }
}
export const DeckList = connect(state => ({ state }))(_DeckList);

export class _ProgressBar extends React.Component<
  ConnectedProps & { deck_id: number; showCardIndex?: boolean },
  {}
> {
  render() {
    const deck_id = this.props.deck_id;
    const deck = this.props.state.deck.byId[deck_id];
    const index = `(${deck.currentIndex})`;
    const cards = Selector.getCardList(this.props.state, deck_id);
    const mastered = cards.filter(x => !!x && x.mastered);
    const width = cards.length > 0 ? mastered.length / cards.length * 100 : 0;
    return (
      <RN.View
        style={{
          height: 20,
          backgroundColor: '#DEE2E6',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <SD.ProgressBar width={`${width}%`} />
        <RN.View
          style={{
            flex: 1,
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            paddingRight: 5,
          }}
        >
          <RN.Text
            style={{
              fontSize: 13,
              fontWeight: 'bold',
            }}
          >{`${mastered.length}/${cards.length}${index}`}</RN.Text>
        </RN.View>
      </RN.View>
    );
  }
}
export const ProgressBar = connect(state => ({ state }))(_ProgressBar);
