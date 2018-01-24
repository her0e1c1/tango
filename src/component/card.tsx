import * as _ from 'lodash';
import * as React from 'react';
import * as RN from 'react-native';
import * as Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import GestureRecognizer from 'react-native-swipe-gestures';
import Swipeout from 'react-native-swipeout';
import DeckSwiper from 'react-native-deck-swiper';
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

@connect((state: RootState) => ({ card: state.card }), {})
export default class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      item: null,
    };
  }
  render() {
    const ids = this.props.card.byDeckId[this.props.deck.id] || [];
    const cards = ids.map(id => this.props.card.byId[id]).slice(0, 200);
    return !this.state.item ? (
      <RN.ScrollView>
        {cards.map((item, index) => (
          <Item
            key={item.id}
            item={item}
            onPress={() => this.setState({ item, index })}
          />
        ))}
      </RN.ScrollView>
    ) : (
      <RN.Modal
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => {}}
      >
        <CardView
          index={this.state.index || 0}
          items={cards}
          onClose={() => this.setState({ item: null })}
        />
      </RN.Modal>
    );
  }
}
