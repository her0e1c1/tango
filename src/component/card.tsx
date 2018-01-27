import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardView from './view';

const CardCard = styled(RN.View)`
  flex: 1;
  align-self: stretch;
  padding: 10px;
  background-color: white;
  border-style: solid;
  border-width: 1px;
`;

const CardTitle = styled(RN.Text)`
  color: black;
  font-size: 13px;
`;

@connect((state: RootState) => ({}), {
  deleteCard: Action.deleteCard,
})
export class CardItem extends React.Component<
  { onPress: Callback; item: Card },
  {}
> {
  render() {
    const { item } = this.props;
    return (
      <Swipeout
        autoClose
        right={[
          {
            text: 'DEL',
            backgroundColor: 'red',
            onPress: () => this.props.deleteCard(item),
          },
        ]}
      >
        <RN.TouchableOpacity
          onPress={() => this.props.onPress()}
          onLongPress={() => alert(JSON.stringify(item))}
        >
          <CardCard>
            <CardTitle>{item.name}</CardTitle>
          </CardCard>
        </RN.TouchableOpacity>
      </Swipeout>
    );
  }
}

@connect((state: RootState) => ({ card: state.card, deck: state.nav.deck }), {
  goTo: Action.goTo,
})
export default class CardList extends React.Component<{}, {}> {
  render() {
    const ids = this.props.card.byDeckId[this.props.deck.id] || [];
    const cards = ids.map(id => this.props.card.byId[id]).slice(0, 200);
    return (
      <RN.ScrollView>
        {cards.map((item, index) => (
          <CardItem
            key={item.id}
            item={item}
            onPress={() => this.props.goTo({ card: item, index })}
          />
        ))}
      </RN.ScrollView>
    );
  }
}
