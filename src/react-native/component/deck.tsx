import * as React from 'react';
import * as RN from 'react-native';
import * as SD from './styled';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Action from 'src/react-native/action';
import { getSelector } from 'src/selector';
import * as C from 'src/constant';

const deckAction = (dispatch: any, item: Deck) => {
  NB.ActionSheet.show(
    {
      title: 'Deck Action',
      options: [
        'Show Card List',
        'Edit This Deck',
        'Upload To Google Spread Sheet',
        'Cancel',
      ],
      cancelButtonIndex: 3,
    },
    async index => {
      if (index === 0) {
        await dispatch(Action.goTo('deck', { deckId: item.id }));
      } else if (index === 1) {
        await dispatch(Action.goTo('deckEdit', { deckId: item.id }));
      } else if (index === 2) {
        if (item.sheetId) {
          await dispatch(Action.loadingStart());
          await dispatch(Action.sheetUpload(item));
          await dispatch(Action.loadingEnd());
        } else {
          alert('NO SPREAD SHEET');
        }
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
    const { dispatch } = this.props;
    return (
      <RN.FlatList
        data={getSelector(this.props.state).deck.mine.map(d => ({
          ...d,
          key: d.id,
        }))}
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
                    onPress={() => {
                      RN.Alert.alert('Are you sure?', '', [
                        {
                          text: 'Delete',
                          onPress: async () => {
                            await dispatch(Action.loadingStart());
                            await dispatch(Action.deckDelete(item.id));
                            await dispatch(Action.loadingEnd());
                          },
                        },
                        { text: 'Cancel', onPress: () => {} },
                      ]);
                    }}
                  >
                    <NB.Icon active name="trash" />
                  </NB.Button>
                ),
                body: (
                  <RN.TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (item.currentIndex == 0) {
                        dispatch(Action.goTo('deckStart', { deckId: item.id }));
                      } else {
                        dispatch(Action.goTo('card', { deckId: item.id }));
                      }
                    }}
                    onLongPress={() =>
                      dispatch(Action.goTo('deckEdit', { deckId: item.id }))
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
    const selector = getSelector(this.props.state);
    const deck = selector.deck.getByIdOrEmpty(deckId);
    const index = `(${deck.currentIndex})`;
    const cards = selector.card.deckId(deckId);
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
  ConnectedProps & { deckId: string },
  {}
> {
  componentDidMount() {
    this.deckEdit({});
  }
  deckEdit(edit: Partial<Deck>) {
    const deck = this.props.state.deck.byId[this.props.deckId];
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
            <NB.Text>{deck.sheetId}</NB.Text>
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
              {['']
                .concat(C.CATEGORY)
                .concat(this.props.state.deck.categories)
                .map((x, i) => (
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

        <NB.ListItem noBorder>
          <NB.Left>
            <NB.Text>Only Body Converted</NB.Text>
          </NB.Left>
          <NB.Body>
            <RN.Switch
              value={Boolean(deck.onlyBody)}
              onValueChange={onlyBody => this.deckEdit({ onlyBody })}
            />
          </NB.Body>
        </NB.ListItem>
      </NB.Content>
    );
  }
}
export const DeckEdit = connect(state => ({ state }))(_DeckEdit);

export class _DeckStart extends React.Component<
  ConnectedProps & { deckId: string },
  {}
> {
  render() {
    const selector = getSelector(this.props.state);
    const deck = selector.deck.getByIdOrEmpty(this.props.deckId);
    const allTags = deck.getTags();
    return (
      <NB.Content>
        <NB.Button
          full
          onPress={async () => {
            await this.props.dispatch(
              Action.deckInsert({
                id: deck.id,
                currentIndex: 0,
                cardOrderIds: deck.getCardOrderIds(),
              } as Deck)
            );
            await this.props.dispatch(Action.goToFirstCard());
          }}
        >
          <NB.Text>Learn {deck.getCardOrderIds().length} card(s)!</NB.Text>
        </NB.Button>

        <NB.Separator bordered>
          <NB.Text>max score {deck.scoreMax}</NB.Text>
        </NB.Separator>

        <NB.ListItem>
          <RN.Slider
            step={1}
            value={deck.scoreMax}
            minimumValue={-10}
            maximumValue={10}
            onSlidingComplete={scoreMax =>
              this.props.dispatch(
                Action.deckInsert({ id: deck.id, scoreMax } as Deck)
              )
            }
            style={{ flex: 1 }}
          />
        </NB.ListItem>

        {allTags.length > 0 && (
          <React.Fragment>
            <NB.Separator bordered>
              <NB.Text>Filter by tags</NB.Text>
            </NB.Separator>
            <NB.ListItem
              style={{ justifyContent: 'flex-end', flexDirection: 'row' }}
            >
              <NB.Button
                small
                onPress={() =>
                  this.props.dispatch(
                    Action.deckBulkInsert([
                      { id: deck.id, selectedTags: allTags } as Deck,
                    ])
                  )
                }
              >
                <NB.Text>ALL</NB.Text>
              </NB.Button>
              <NB.Text style={{ padding: 5 }}>/</NB.Text>
              <NB.Button
                light
                small
                onPress={() =>
                  this.props.dispatch(
                    Action.deckBulkInsert([
                      { id: deck.id, selectedTags: [] as any } as Deck,
                    ])
                  )
                }
              >
                <NB.Text>CLEAR</NB.Text>
              </NB.Button>
            </NB.ListItem>
          </React.Fragment>
        )}

        {allTags.map((tag, i) => (
          <NB.ListItem
            key={i}
            onPress={() => {
              let tags = deck.selectedTags;
              if (tags.includes(tag)) {
                tags = tags.filter(t => t != tag);
              } else {
                tags = [...tags, tag];
              }
              this.props.dispatch(
                Action.deckBulkInsert([
                  { id: deck.id, selectedTags: tags } as Deck,
                ])
              );
            }}
          >
            <NB.Left>
              <NB.Text>{tag}</NB.Text>
            </NB.Left>
            <NB.Right>
              <NB.Radio selected={deck.selectedTags.includes(tag)} />
            </NB.Right>
          </NB.ListItem>
        ))}
      </NB.Content>
    );
  }
}
export const DeckStart = connect(state => ({ state }))(_DeckStart);
