import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import * as Action from 'src/action';
import * as I from 'src/interface';
import * as SD from './styled';
import MasteredCircle from './masteredCircle';
import { withNavigation } from 'react-navigation';
import * as Selector from 'src/selector';

@withNavigation
export class CardList extends React.Component<Props, {}> {
  render() {
    const { deck_id } = this.props.navigation.state.params;
    const cards = Selector.getCardList(this.props.state, deck_id);
    if (cards.length <= 0) {
      return (
        <RN.View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <SD.CardTitle>NO CARDS</SD.CardTitle>
        </RN.View>
      );
    }
    return (
      <RN.FlatList
        data={cards.filter(x => !!x).map((item, index) => ({
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
            <SD.CardCard>
              <MasteredCircle card={item} />
              <RN.TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                }}
                onPress={() => {
                  this.props.navigation.navigate('card', {
                    card_id: item.id,
                    deck_id: item.deck_id,
                  });
                  const cards = Action.getCardList(
                    this.props.state,
                    item.deck_id
                  );
                  let cardIndex = 0;
                  for (let i = 0; i < cards.length; i++) {
                    if (cards[i].id == item.id) {
                      cardIndex = i;
                    }
                  }
                  this.props.updateConfig({ cardIndex });
                }}
                // onPress={() => this.props.goTo({ card: item, index })}
                onLongPress={() => alert(JSON.stringify(item))}
              >
                <SD.CardTitle>{item.name}</SD.CardTitle>
              </RN.TouchableOpacity>
            </SD.CardCard>
          </Swipeout>
        )}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  deleteCard: Action.deleteCard,
  toggle: Action.toggleMastered,
  updateConfig: Action.updateConfig,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(CardList);
