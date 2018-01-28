import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardView from './view';

const Circle = styled(RN.View)`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border-width: 1px;
  border-style: solid;
`;

const CardCard = styled(RN.View)`
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 10px 0;
  background-color: white;
  border-style: solid;
  border-width: 1px;
`;

const CardTitle = styled(RN.Text)`
  color: black;
  font-size: 13px;
`;

@connect((state: RootState) => ({ cards: Action.getCurrentCardList(state) }), {
  deleteCard: Action.deleteCard,
  goTo: Action.goTo,
})
export default class CardList extends React.Component<{ cards: Card[] }, {}> {
  render() {
    return (
      <RN.ScrollView>
        {this.props.cards.map((item, index) => (
          <Swipeout
            key={item.id}
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
              onPress={() => this.props.goTo({ card: item, index })}
              onLongPress={() => alert(JSON.stringify(item))}
            >
              <CardCard>
                <Circle
                  style={{
                    marginHorizontal: 5,
                    backgroundColor: item.mastered ? 'green' : 'white',
                  }}
                />
                <CardTitle>{item.name}</CardTitle>
              </CardCard>
            </RN.TouchableOpacity>
          </Swipeout>
        ))}
      </RN.ScrollView>
    );
  }
}
