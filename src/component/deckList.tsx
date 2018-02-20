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
class DeckList extends React.Component<Props, { refreshing: boolean }> {
  constructor(props) {
    super(props);
    this.state = { refreshing: false };
  }
  async componentDidMount() {
    await this.props.selectDeck();
    await this.props.selectCard();
  }
  getLeftItems(deck: Deck) {
    const { uid } = this.props.state.user;
    const items = [
      {
        text: 'COPY',
        backgroundColor: 'blue',
        onPress: () => this.props.insertByURL(deck.url),
      },
    ];
    if (uid) {
      items.push({
        text: 'UP',
        backgroundColor: 'green',
        onPress: () => this.props.upload(deck),
      });
    }
    return items;
  }
  render() {
    return (
      <RN.FlatList
        data={this.props.decks.map(d => ({ ...d, key: d.id }))}
        onRefresh={async () => {
          await this.props.selectDeck();
          await this.props.selectCard();
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
                  onPress: () => this.props.deleteDeck(item),
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

const mapStateToProps = (state: RootState) => ({
  state,
  decks: Object.values(state.deck),
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  deleteDeck: Action.deck.remove,
  insertByURL: Action.tryInsertByURL,
  selectCard: Action.selectCard,
  selectDeck: Action.deck.select,
  upload: Action.deck.upload,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(DeckList);
