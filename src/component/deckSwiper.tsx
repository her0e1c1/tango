import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import * as Selector from 'src/selector';
import DeckSwiper from 'react-native-deck-swiper';
import { connect } from 'react-redux';
import { Controller } from './controller';
import { CardDetail } from './card';
import { MasteredCircle } from './card';
import { CardView } from './cardView';

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
      return <RN.View />;
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
              paddingRight: 10, // <NB.CheckBox /> has left: 10. Android hide the half of it
            }}
          >
            <MasteredCircle card={cards[currentIndex] || {}} />
          </RN.View>
          <RN.TouchableOpacity
            onPress={() => dispatch(Action.nav.goToPrevCard())}
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
            onPress={() => dispatch(Action.nav.goToNextCard())}
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
            onSwipedRight={() => dispatch(Action.nav.cardSwipeRight())}
            onSwipedLeft={() => dispatch(Action.nav.cardSwipeLeft())}
            onSwipedTop={() => dispatch(Action.nav.cardSwipeUp())}
            onSwipedBottom={() => dispatch(Action.nav.cardSwipeDown())}
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
                {item.category === 'math' || deck.category === 'math' ? (
                  <RN.View style={{ flex: 1 }}>
                    <CardView
                      center
                      body={
                        this.props.state.config.showHint ? item.hint : item.name
                      }
                      category={'math'}
                    />
                  </RN.View>
                ) : (
                  <RN.View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <RN.Text style={{ fontSize: 24 }}>
                      {this.props.state.config.showHint ? item.hint : item.name}
                    </RN.Text>
                  </RN.View>
                )}
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
