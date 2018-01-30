import styled from 'styled-components';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import CardView from './view';
import * as I from 'src/interface';

const Circle = styled(RN.View)`
  background-color: ${({ theme, mastered }: AppContext) =>
    mastered ? 'green' : theme.circleBackgroundColor};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border-width: 1px;
  border-style: solid;
`;

const CardCard = styled(RN.View)`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: AppContext) => theme.cardBackgroundColor};
  border-style: solid;
  border-width: 1px;
`;

const CardTitle = styled(RN.Text)`
  color: ${({ theme }: AppContext) => theme.mainColor};
  font-size: 13px;
`;

export class CardList extends React.Component<Props, {}> {
  render() {
    return (
      <RN.FlatList
        data={this.props.cards.map((item, index) => ({
          ...item,
          key: item.id,
        }))}
        renderItem={({ item, index }) => (
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
            <CardCard>
              <RN.TouchableOpacity onPress={() => this.props.toggle(item)}>
                <Circle
                  style={{ marginHorizontal: 5 }}
                  mastered={item.mastered}
                />
              </RN.TouchableOpacity>
              <RN.TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                }}
                onPress={() => this.props.goTo({ card: item, index })}
                onLongPress={() => alert(JSON.stringify(item))}
              >
                <CardTitle>{item.name}</CardTitle>
              </RN.TouchableOpacity>
            </CardCard>
          </Swipeout>
        )}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  state,
  cards: Action.getCurrentCardList(state),
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  deleteCard: Action.deleteCard,
  goTo: Action.goTo,
  toggle: Action.toggleMastered,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(CardList);
