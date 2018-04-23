import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import CardView from './cardView';
import * as SD from './styled';
import Swipeout from 'react-native-swipeout';
import * as Selector from 'src/selector';

export class _MasteredCircle extends React.Component<
  ConnectedProps & { card: Card },
  {}
> {
  render() {
    const { dispatch } = this.props;
    const card = this.props.card;
    return (
      <RN.TouchableOpacity
        onPress={() => dispatch(Action.card.toggleMastered(card))}
      >
        <SD.Circle mastered={card.mastered} />
      </RN.TouchableOpacity>
    );
  }
}
export const MasteredCircle = connect(state => ({ state }))(_MasteredCircle);

export class _CardDetail extends React.Component<
  ConnectedProps & { onLongPress: Callback },
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
    const window = RN.Dimensions.get('window');
    const height = window.height;
    const card = Selector.getCurrentCard(this.props.state);
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
        <RN.TouchableWithoutFeedback
          onPress={() => this.state.view || this.props.onLongPress()}
          onLongPress={() => {}}
        >
          <RN.View style={{ flex: 1 }}>
            <CardView card={card} />
          </RN.View>
        </RN.TouchableWithoutFeedback>
        <RN.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 50,
            flexDirection: 'row',
            zIndex: 2,
          }}
        >
          {/* <RN.View style={{ backgroundColor: '#cd000050', flex: 1 }} />
          <RN.View style={{ backgroundColor: '#00cd0050', flex: 1 }} /> */}
          <RN.TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#0000cd10',
            }}
            onPress={() => this.setState({ view: !this.state.view })}
          >
            {!this.state.view && <NB.Icon name="md-eye-off" />}
          </RN.TouchableOpacity>
        </RN.View>
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
    );
  }
}
export const CardDetail = connect(state => ({ state }))(_CardDetail);

export class _CardList extends React.Component<ConnectedProps, {}> {
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
                onPress: () => dispatch(Action.card.deleteCard(item)),
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
                  dispatch(
                    Action.nav.goTo('card', {
                      card_id: item.id,
                      deck_id: item.deck_id,
                    })
                  );
                }}
                onLongPress={() =>
                  dispatch(Action.nav.goTo('cardEdit', { card_id: item.id }))
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
export const CardList = connect(state => ({ state }))(_CardList);
