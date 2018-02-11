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

class Data extends React.Component<Props, { decks: Deck[] }> {
  state = { decks: [] as Deck[] };
  componentDidMount() {
    const { uid } = this.props.state.user;
    firebase
      .database()
      .ref(`/user/${uid}/deck`)
      .once('value', snapshot => {
        const v = snapshot.val();
        v && this.setState({ decks: v });
        console.log(snapshot);
      });
  }
  render() {
    const { decks } = this.state;
    return (
      <SD.Container>
        {decks.map(d => (
          <RN.TouchableOpacity onPress={() => this.props.import(d.id)}>
            <RN.Text>{d.name}</RN.Text>
          </RN.TouchableOpacity>
        ))}
      </SD.Container>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  goTo: Action.goTo,
  goToNextCard: Action.goToNextCard,
  goToPrevCard: Action.goToPrevCard,
  import: Action.deck.importFromFireBase,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(Data);
