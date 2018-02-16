import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as firebase from 'firebase';
import * as I from 'src/interface';
import * as SD from './styled';
import { connect } from 'react-redux';

const Help = () => (
  <RN.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <RN.Text>Help Me!!! </RN.Text>
  </RN.View>
);

class Data extends React.Component<Props, { decks: Deck[]; cards: Card[] }> {
  state = { decks: [] as Deck[], cards: [] as Card[] };
  componentDidMount() {
    const { uid } = this.props.state.user;
    firebase
      .database()
      .ref(`/user/${uid}/deck`)
      .on('value', snapshot => {
        const v = snapshot && snapshot.val();
        v && this.setState({ decks: v });
      });
  }
  setCards(deck_id: number) {
    const { uid } = this.props.state.user;
    firebase
      .database()
      .ref(`/user/${uid}/card`)
      .orderByChild('deck_id')
      .equalTo(deck_id)
      .once('value', snapshot => {
        const v = snapshot.val();
        v && this.setState({ cards: Object.values(v) });
      });
  }
  render() {
    const { decks, cards } = this.state;
    return (
      <SD.Container>
        <RN.FlatList
          data={decks.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Deck }) => (
            <RN.TouchableOpacity onPress={() => this.setCards(item.id)}>
              <SD.DeckCard style={{ marginBottom: 10 }}>
                <SD.DeckTitle>{item.name}</SD.DeckTitle>
              </SD.DeckCard>
            </RN.TouchableOpacity>
          )}
        />
        <RN.FlatList
          data={cards.filter(x => !!x).map((d, key) => ({ ...d, key }))}
          renderItem={({ item }: { item: Card }) => (
            <RN.TouchableOpacity onPress={() => this.props.import(item.id)}>
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

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  goToNextCard: Action.goToNextCard,
  goToPrevCard: Action.goToPrevCard,
  import: Action.deck.importFromFireBase,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(Data);
