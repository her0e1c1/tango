import * as Action from 'src/react-native/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import { CardView } from './cardView';
import * as SD from './styled';
import Swipeout from 'react-native-swipeout';
import * as Selector from 'src/selector';
import { getSelector } from 'src/selector';

export class _MasteredCircle extends React.Component<
  ConnectedProps & { card: Card },
  {}
> {
  render() {
    const { dispatch } = this.props;
    const card = this.props.card;
    return (
      <NB.CheckBox
        checked={Boolean(card.mastered)}
        onPress={() =>
          dispatch(Action.cardUpdate({ ...card, mastered: !card.mastered }))
        }
      />
    );
  }
}
export const MasteredCircle = connect(state => ({ state }))(_MasteredCircle);

export class _CardDetail extends React.Component<
  ConnectedProps & { onLongPress: () => void },
  { view: boolean }
> {
  state = { view: false };
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
    const selector = getSelector(this.props.state);
    const card = Selector.getCurrentCard(this.props.state);
    const deck = selector.deck.current;
    const params = {
      category: deck.category,
      convertToBr: deck.convertToBr,
    };
    return (
      <RN.View
        style={{
          position: 'absolute',
          flex: 1,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        {this.state.view ? (
          // Android can not wrap TouchableWithoutFeedback
          // because scroll in webview doesn't work
          <CardView body={card.backText} {...params} />
        ) : (
          <RN.TouchableWithoutFeedback
            onPress={() => this.state.view || this.props.onLongPress()}
          >
            <RN.View style={{ flex: 1 }}>
              <CardView body={card.backText} {...params} />
            </RN.View>
          </RN.TouchableWithoutFeedback>
        )}
        {!this.state.view && (
          <RN.TouchableOpacity
            onPress={() => dispatch(Action.cardSwipeLeft())}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 50,
            }}
          />
        )}
        {!this.state.view && (
          <RN.TouchableOpacity
            onPress={() =>
              !this.state.view && dispatch(Action.cardSwipeRight())
            }
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 50,
            }}
          />
        )}
        <RN.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 50,
            zIndex: 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0000cd10',
          }}
        >
          <RN.TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() =>
              this.state.view
                ? this.props.onLongPress()
                : this.setState({ view: true })
            }
          >
            <NB.Icon name={!this.state.view ? 'md-eye-off' : 'arrow-down'} />
          </RN.TouchableOpacity>
        </RN.View>
      </RN.View>
    );
  }
}
export const CardDetail = connect(state => ({ state }))(_CardDetail);

export class _CardList extends React.Component<ConnectedProps, {}> {
  render() {
    const { dispatch } = this.props;
    const cards = getSelector(this.props.state).card.currentList;
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
        data={cards.map(item => ({
          ...item,
          key: item.id,
        }))}
        renderItem={({ item }) => (
          <Swipeout
            key={item.id}
            autoClose
            right={[
              {
                text: 'DEL',
                backgroundColor: 'red',
                onPress: () => dispatch(Action.cardDelete(item.id)),
              },
            ]}
          >
            <SD.CardListItem>
              <MasteredCircle card={item} />
              <RN.TouchableOpacity
                style={{
                  flex: 1,
                  marginLeft: 15, // <NB.CheckBox/> has left: 10
                  marginRight: 5,
                  paddingVertical: 10,
                }}
                onPress={() => {
                  dispatch(Action.goToCard(item));
                  dispatch(Action.goToCardById(item.id, item.deckId));
                }}
                onLongPress={() =>
                  dispatch(Action.goTo('cardEdit', { card_id: item.id }))
                }
              >
                <SD.CardTitle>{item.frontText}</SD.CardTitle>
              </RN.TouchableOpacity>
            </SD.CardListItem>
          </Swipeout>
        )}
      />
    );
  }
}
export const CardList = connect(state => ({ state }))(_CardList);
