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
    const cards = Selector.getCurrentCardList(this.props.state);
    if (cards.length <= 0) {
      return (
        <RN.View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <SD.CardTitle>
            NO CARDS {`start from ${this.props.state.config.start}`}
          </SD.CardTitle>
        </RN.View>
      );
    }
    return (
      <RN.FlatList
        data={cards.map((item, index) => ({
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
                  this.props.goToCard(item);
                  this.props.navigation.navigate('card', {
                    card_id: item.id,
                    deck_id: item.deck_id,
                  });
                }}
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
  goToCard: Action.nav.goToCard,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(CardList);
