import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import * as I from 'src/interface';
import { DeckCard, DeckTitle } from './styled';
import ProgressBar from './progressBar';

class DeckList extends React.Component<Props, { refreshing: boolean }> {
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
        onRefresh={async () => {
          // TODO: fix later
          await this.props.selectDeck();
          await this.props.selectCard();
          await this.setState({ refreshing: false });
        }}
        refreshing={this.state.refreshing}
        renderItem={({ item }: { item: Deck }) => {
          const allCardIds = this.props.card.byDeckId[item.id] || [];
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
                  onPress: () => this.props.deleteDeck(item),
                },
              ]}
              left={[
                {
                  text: 'COPY',
                  backgroundColor: 'blue',
                  onPress: () => this.props.insertByURL(item.url),
                },
              ]}
            >
              <RN.TouchableOpacity
                onPress={() => this.props.goTo({ deck: item })}
                onLongPress={() => alert(JSON.stringify(item))}
              >
                <DeckCard>
                  <DeckTitle>{item.name}</DeckTitle>
                  <ProgressBar deck_id={item.id} />
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
  card: state.card,
  state,
  decks: Object.values(state.deck),
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  deleteDeck: Action.deleteDeck,
  insertByURL: Action.tryInsertByURL,
  goTo: Action.goTo,
  selectCard: Action.selectCard,
  selectDeck: Action.selectDeck,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(DeckList);
