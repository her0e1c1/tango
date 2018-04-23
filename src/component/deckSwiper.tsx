import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import DeckSwiper from 'react-native-deck-swiper';
import { connect } from 'react-redux';
import { Controller } from './controller';
import { CardDetail } from './card';
import { MasteredCircle } from './card';
import * as Selector from 'src/selector';

class View extends React.Component<
  { deck_id: number } & ConnectedProps,
  { visible: boolean; width: number; height: number }
> {
  constructor(props) {
    super(props);
    const window = RN.Dimensions.get('window');
    const width = window.width - 20; // HOTFIX: may fix Swiper width?
    const height = window.height * (3 / 4);
    this.state = { visible: false, width, height };
  }

  changeEvent(dimensions) {
    this.setState({
      width: dimensions.window.width - 20,
      height: dimensions.window.height * (3 / 4),
    });
  }
  componentDidMount() {
    this.changeEvent = this.changeEvent.bind(this);
    RN.Dimensions.addEventListener('change', this.changeEvent as any); // TODO: upgrade @types/react-native
  }
  componentWillUnmount() {
    RN.Dimensions.removeEventListener('change', this.changeEvent as any); // TODO: upgrade @types/react-native
  }
  render() {
    const { dispatch } = this.props;
    const width = this.state.width;
    const height = this.state.height;
    const cards = Selector.getCurrentCardList(this.props.state);
    const deck = Selector.getCurrentDeck(this.props.state);
    const currentIndex = deck.currentIndex;
    if (currentIndex < 0 || cards.length <= currentIndex) {
      return;
    }

    return this.state.visible ? (
      <CardDetail onLongPress={() => this.setState({ visible: false })} />
    ) : (
      // Need to wrap with View otherwise <Header/> is not shown
      <RN.View style={{ flex: 1 }}>
        <RN.View style={{ flex: 1 }}>
          <RN.View
            style={{
              position: 'absolute',
              margin: 5,
              zIndex: 1,
            }}
          >
            <MasteredCircle card={cards[currentIndex] || {}} />
          </RN.View>
          <DeckSwiper
            /* I think DeckSwiper position is absolute */
            // backgroundColor={this.props.theme.cardBackgroundColor}
            backgroundColor={'white'}
            cardIndex={currentIndex}
            cards={cards}
            onSwipedRight={index => dispatch(Action.nav.cardSwipeRight(index))}
            onSwipedLeft={index => dispatch(Action.nav.cardSwipeLeft(index))}
            onSwipedTop={index => dispatch(Action.nav.cardSwipeUp(index))}
            onSwipedBottom={index => dispatch(Action.nav.cardSwipeDown(index))}
            // onTapCard={() => {}}
            goBackToPreviousCardOnSwipeTop={
              this.props.state.config.cardSwipeUp === 'goToPrevCard'
            }
            goBackToPreviousCardOnSwipeDown={
              this.props.state.config.cardSwipeDown === 'goToPrevCard'
            }
            goBackToPreviousCardOnSwipeLeft={
              this.props.state.config.cardSwipeLeft === 'goToPrevCard'
            }
            goBackToPreviousCardOnSwipeRight={
              this.props.state.config.cardSwipeRight == 'goToPrevCard'
            }
            onSwipedAll={() => dispatch(Action.nav.swipeAll())}
            disableBottomSwipe={false}
            showSecondCard={false}
            cardHorizontalMargin={10}
            cardVerticalMargin={0}
            marginBottom={0}
            zoomFriction={0}
            swipeAnimationDuration={100}
            renderCard={(
              item = {} as Card // Sometimes item is undefined :(
            ) => (
              <RN.TouchableWithoutFeedback
                key={item.id}
                onPress={() => this.setState({ visible: true })}
              >
                <RN.View
                  style={{
                    width,
                    height,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <RN.Text style={{ fontSize: 24 }}>
                    {this.props.state.config.showHint ? item.hint : item.name}
                  </RN.Text>
                </RN.View>
              </RN.TouchableWithoutFeedback>
            )}
          />
        </RN.View>

        <NB.Footer>
          <NB.Body>
            <Controller />
          </NB.Body>
        </NB.Footer>
      </RN.View>
    );
  }
}
export default connect(state => ({ state }))(View);
