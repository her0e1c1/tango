import * as Action from 'src/react-native/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { getSelector } from 'src/selector';
import DeckSwiper from 'react-native-deck-swiper';
import { connect } from 'react-redux';
import { Controller } from './controller';
import { CardDetail } from './card';
import { MasteredCircle } from './card';
import { CardView } from './cardView';

class View extends React.Component<
  { deck_id: number } & ConnectedProps,
  { width: number; height: number }
> {
  constructor(props) {
    super(props);
    const window = RN.Dimensions.get('window');
    const width = window.width - 20; // HOTFIX: may fix Swiper width?
    const height = window.height * (3 / 4);
    this.state = { width, height };
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
    const selector = getSelector(this.props.state);
    const cards = selector.card.currentList;
    const deck = selector.deck.current;
    const currentIndex = deck.currentIndex;
    if (currentIndex < 0 || cards.length <= currentIndex) {
      return <RN.View />;
    }

    return this.props.state.config.showBody ? (
      <CardDetail
        onLongPress={() => dispatch(Action.configToggle('showBody'))}
      />
    ) : (
      // Need to wrap with View otherwise <Header/> is not shown
      <RN.View style={{ flex: 1 }}>
        <RN.View style={{ flex: 1 }}>
          <RN.View
            style={{
              position: 'absolute',
              margin: 5,
              zIndex: 1,
              paddingRight: 10, // <NB.CheckBox /> has left: 10. Android hide the half of it
            }}
          >
            <MasteredCircle card={cards[currentIndex] || {}} />
          </RN.View>
          <RN.TouchableOpacity
            onPress={() => dispatch(Action.cardSwipeLeft())}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 50,
              zIndex: 1,
            }}
          />
          <RN.TouchableOpacity
            onPress={() => dispatch(Action.cardSwipeRight())}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 50,
              zIndex: 1,
            }}
          />
          <DeckSwiper
            /* I think DeckSwiper position is absolute */
            // backgroundColor={this.props.theme.cardBackgroundColor}
            cardStyle={{ height, width }}
            backgroundColor={'white'}
            cardIndex={currentIndex}
            cards={cards}
            onSwipedRight={() => dispatch(Action.cardSwipeRight())}
            onSwipedLeft={() => dispatch(Action.cardSwipeLeft())}
            onSwipedTop={() => dispatch(Action.cardSwipeUp())}
            onSwipedBottom={() => dispatch(Action.cardSwipeDown())}
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
                onPress={() => dispatch(Action.configToggle('showBody'))}
              >
                <RN.View style={{ flex: 1 }}>
                  <CardView
                    center
                    body={
                      // Keep react-native-deck-swiper@1.4.6
                      // otherwise showHint will not be updated
                      this.props.state.config.showHint
                        ? item.hint
                        : item.frontText
                    }
                    category={item.category}
                  />
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
