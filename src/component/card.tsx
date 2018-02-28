import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import CardView from './cardView';
import * as SD from './styled';
import { withNavigation } from 'react-navigation';
import Swipeout from 'react-native-swipeout';
import * as Selector from 'src/selector';

@connect(state => ({ state }))
export class MasteredCircle extends React.Component<{ card: Card }, {}> {
  render() {
    const { dispatch } = this.props;
    const card = this.props.card;
    return (
      <RN.TouchableOpacity
        onPress={() => dispatch(Action.toggleMastered(card))}
      >
        <SD.Circle mastered={card.mastered} />
      </RN.TouchableOpacity>
    );
  }
}

@connect(state => ({ state }))
export class CardDetail extends React.Component<{ onLongPress: Callback }, {}> {
  static navigationOptions = () => ({
    gesturesEnabled: false,
  });
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  componentWillUnmount() {
    RN.StatusBar.setHidden(false);
  }
  render() {
    const { dispatch } = this.props;
    const window = RN.Dimensions.get('window');
    const height = window.height;
    const card = Action.getCurrentCard(this.props.state);
    return (
      <RN.Modal
        animationType={'none'}
        supportedOrientations={['portrait', 'landscape']}
        visible={true}
        onRequestClose={() => {}}
      >
        <RN.TouchableWithoutFeedback onLongPress={this.props.onLongPress}>
          <RN.View style={{ flex: 1 }}>
            <CardView card={card} />
            <SD.SideControl
              style={{ left: 0, height }}
              onPress={() => dispatch(Action.nav.goToPrevCard())}
              onLongPress={() => {}}
            />
            <SD.SideControl
              style={{ right: 0, height }}
              onPress={() => dispatch(Action.nav.goToNextCard())}
              onLongPress={() => alert(JSON.stringify(card.name))}
            />
          </RN.View>
        </RN.TouchableWithoutFeedback>
      </RN.Modal>
    );
  }
}

@withNavigation
@connect(state => ({ state }))
export class CardList extends React.Component<{}, {}> {
  render() {
    const { dispatch } = this.props;
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
                onPress: () => dispatch(Action.deleteCard(item)),
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
                  dispatch(Action.nav.goToCard(item));
                  this.props.navigation.navigate('card', {
                    card_id: item.id,
                    deck_id: item.deck_id,
                  });
                }}
                onLongPress={() =>
                  this.props.navigation.navigate('cardEdit', { card: item })
                }
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
