import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as C from 'src/constant';
import * as Action from 'src/react-native/action';
import * as Selector from 'src/selector';

const deckAction = (dispatch: any, item: Deck) => {
  NB.ActionSheet.show(
    {
      title: 'Deck Action',
      options: ['Show Card List', 'Edit This Deck', 'Cancel'],
      cancelButtonIndex: 3,
    },
    async index => {
      if (index === 0) {
        await dispatch(Action.goTo('deck', { deck_id: item.id }));
      } else if (index === 1) {
        await dispatch(Action.goTo('deckEdit', { deck_id: item.id }));
      } else {
        // DO NOTHING
      }
    }
  );
};

class _DeckList extends React.Component<
  ConnectedProps,
  { refreshing: boolean }
> {
  state = { refreshing: false };
  render() {
    const decks = Selector.getDecks(this.props.state);
    const { dispatch } = this.props;
    return (
      <RN.FlatList
        data={decks.map(d => ({ ...d, key: d.id }))}
        onRefresh={async () => {
          await dispatch(Action.deckFetch());
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
                // You can not show more than one item
                left: (
                  <NB.Button
                    primary
                    onPress={async () => await deckAction(dispatch, item)}
                  >
                    <NB.Icon active name="list" />
                  </NB.Button>
                ),
                right: (
                  <NB.Button
                    danger
                    onPress={() => dispatch(Action.deckDelete(item.id))}
                  >
                    <NB.Icon active name="trash" />
                  </NB.Button>
                ),
                body: (
                  <RN.TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      dispatch(Action.goTo('card', { deck_id: item.id }));
                    }}
                    onLongPress={() =>
                      dispatch(Action.goTo('deckEdit', { deck_id: item.id }))
                    }
                  >
                    <NB.View
                      style={{
                        flex: 1,
                        paddingLeft: 20 /* cuz of paddingRight already :(*/,
                      }}
                    >
                      <NB.Title>{item.name}</NB.Title>
                      <ProgressBar deckId={item.id} />
                    </NB.View>
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
  ConnectedProps & { deckId: string; showCardIndex?: boolean },
  {}
> {
  render() {
    const deckId = this.props.deckId;
    const deck = this.props.state.deck.byId[deckId];
    const index = `(${deck.currentIndex})`;
    const cards = Selector.getCardList(this.props.state, deckId);
    const mastered = cards.filter(x => !!x && x.mastered);
    const width = cards.length > 0 ? (mastered.length / cards.length) * 100 : 0;
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

export class _DeckEdit extends React.Component<
  ConnectedProps & { deck_id: string },
  {}
> {
  componentDidMount() {
    this.deckEdit({});
  }
  deckEdit(edit: Partial<Deck>) {
    const deck = this.props.state.deck.byId[this.props.deck_id];
    this.props.dispatch(Action.deckEdit({ ...deck, ...edit }));
  }
  render() {
    const deck = this.props.state.deck.edit || {};
    return (
      <NB.Content>
        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>ID</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Text>{deck.id}</NB.Text>
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Name</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Input
              style={{ backgroundColor: 'white' }}
              value={deck.name}
              onChangeText={name => this.deckEdit({ name })}
            />
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Public</NB.Text>
          </NB.Left>
          <NB.Body>
            <RN.Switch
              value={Boolean(deck.isPublic)}
              onValueChange={isPublic => this.deckEdit({ isPublic })}
            />
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Spread Sheet Id</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Text>{deck.spreadsheetId}</NB.Text>
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Spread Sheet Gid</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Text>{deck.spreadsheetGid}</NB.Text>
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>URL</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Text>{deck.url}</NB.Text>
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem icon>
          <NB.Left>
            <NB.Text>Category</NB.Text>
          </NB.Left>
          <NB.Body>
            <NB.Picker
              style={{
                width: RN.Platform.OS === 'android' ? 120 : undefined,
              }}
              selectedValue={deck.category || ''}
              onValueChange={category => this.deckEdit({ category })}
              {...{ iosIcon: <NB.Icon name="arrow-down" /> }}
            >
              {[''].concat(C.CATEGORY).map((x, i) => (
                <NB.Picker.Item key={i} label={x} value={x} />
              ))}
            </NB.Picker>
          </NB.Body>
        </NB.ListItem>

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Convert two \n to {'<br/>'} tag</NB.Text>
          </NB.Left>
          <NB.Body>
            <RN.Switch
              value={Boolean(deck.convertToBr)}
              onValueChange={convertToBr => this.deckEdit({ convertToBr })}
            />
          </NB.Body>
        </NB.ListItem>
      </NB.Content>
    );
  }
}
export const DeckEdit = connect(state => ({ state }))(_DeckEdit);
