import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import * as I from 'src/interface';
import { DeckCard, DeckTitle } from './styled';
import ProgressBar from './progressBar';
import { withNavigation } from 'react-navigation';

@withNavigation
@connect(state => ({ state }))
export class DeckList extends React.Component<{}, { refreshing: boolean }> {
  constructor(props) {
    super(props);
    this.state = { refreshing: false };
  }
  async componentDidMount() {
    const { dispatch } = this.props;
    await dispatch(Action.deck.select());
    await dispatch(Action.selectCard());
  }
  getLeftItems(deck: Deck) {
    const { dispatch } = this.props;
    const { uid } = this.props.state.user;
    const items = [
      {
        text: 'COPY',
        backgroundColor: 'blue',
        onPress: () => dispatch(Action.deck.insertByURL(deck.url)),
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
          await dispatch(Action.selectCard());
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        ListFooterComponent={() => <RN.View style={{ marginVertical: 50 }} />}
        renderItem={({ item }: { item: Deck }) => {
          return (
            <Swipeout
              autoClose
              style={{ marginBottom: 10 }}
              right={[
                {
                  text: 'DEL',
                  backgroundColor: 'red',
                  onPress: () => dispatch(Action.deck.remove(item)),
                },
              ]}
              left={this.getLeftItems(item)}
            >
              <RN.TouchableOpacity
                onPress={() => {
                  this.props.navigation.navigate('deck', { deck_id: item.id });
                }}
                onLongPress={() => alert(JSON.stringify(item))}
              >
                <DeckCard>
                  <DeckTitle>{item.name}</DeckTitle>
                  <ProgressBar deck_id={item && item.id} />
                </DeckCard>
              </RN.TouchableOpacity>
            </Swipeout>
          );
        }}
      />
    );
  }
}
