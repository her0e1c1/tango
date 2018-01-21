import * as _ from 'lodash';
import * as React from 'react';
import * as RN from 'react-native';
import * as Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import GestureRecognizer from 'react-native-swipe-gestures';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardView from './view';

const Item = (props: { item: Item; onPress: (n: number) => void }) => (
  <Swipeout
    autoClose
    left={[
      {
        text: 'DEL',
        backgroundColor: 'red',
        // onPress: () => props.deleteCard(props.item),
      },
    ]}
  >
    <RN.TouchableOpacity
      onPress={() => props.onPress()}
      onLongPress={() => alert(JSON.stringify(props.item))}
    >
      <RN.View style={{ backgroundColor: '#555', borderWidth: 1 }}>
        <RN.Text style={{ fontSize: 25 /*config*/ }}>{props.item.name}</RN.Text>
      </RN.View>
    </RN.TouchableOpacity>
  </Swipeout>
);

@connect((state: RootState) => ({ cards: Object.values(state.card.byId) }), {})
export default class Card extends React.Component {
  render() {
    const cards = this.props.cards.filter(
      c => c.deck_id === this.props.deck.id
    );
    return (
      <RN.ScrollView>
        <RN.Button title="hi" />
        <CardView />
        <RN.Button title="hi" />
        {cards.map(x => <Item key={x.id} item={x} onPress={() => 1} />)}
      </RN.ScrollView>
    );
  }
}
