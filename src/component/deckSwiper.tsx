import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import { connect } from 'react-redux';
import { ProgressBar } from './deck';
import CardView from './cardView';
import * as SD from './styled';
import * as I from 'src/interface';
import { CardDetail } from './card';
import { mathCategory } from './cardView';
import MasteredCircle from './masteredCircle';
import { withNavigation } from 'react-navigation';

@withNavigation
class View extends React.Component<
  Props & AppContext,
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
    RN.Dimensions.addEventListener('change', this.changeEvent);
  }
  componentWillUnmount() {
    RN.Dimensions.removeEventListener('change', this.changeEvent);
  }
  render() {
    const { deck_id } = this.props.navigation.state.params;
    const width = this.state.width;
    const height = this.state.height;
    const cards = Action.getCurrentCardList(this.props.state);
    const { cardIndex } = this.props.state.config;
    if (cardIndex < 0 || cards.length <= cardIndex) {
      return null;
    }
    const card = cards[cardIndex];
    return this.state.visible ? (
      <CardDetail onLongPress={() => this.setState({ visible: false })} />
    ) : (
      <RN.View style={{ flex: 1 }}>
        {this.props.state.config.showHeader && (
          <RN.View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            {card && <MasteredCircle card={card} />}
            <RN.View style={{ flex: 1 }}>
              <ProgressBar deck_id={deck_id} showCardIndex />
            </RN.View>
          </RN.View>
        )}
        <RN.View style={{ marginTop: 5 }}>
          {/* I think DeckSwiper position is absolute */}
          <DeckSwiper
            // backgroundColor={this.props.theme.cardBackgroundColor}
            cardIndex={this.props.state.config.cardIndex}
            cards={cards}
            onSwipedRight={index => this.props.cardSwipeRight(index)}
            onSwipedLeft={index => this.props.cardSwipeLeft(index)}
            onSwipedTop={index => this.props.cardSwipeUp(index)}
            onSwipedBottom={index => this.props.cardSwipeDown(index)}
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
            onSwipedAll={() => this.props.navigation.goBack()}
            disableBottomSwipe={false}
            showSecondCard={false}
            marginBottom={0}
            cardHorizontalMargin={0}
            zoomFriction={0}
            cardVerticalMargin={10}
            swipeAnimationDuration={100}
            renderCard={(
              item = {} as Card // Sometimes item is undefined :(
            ) => (
              <RN.TouchableWithoutFeedback
                onPress={() =>
                  this.props.updateConfig({
                    showBody: !this.props.state.config.showBody,
                  })
                }
                onLongPress={() => this.setState({ visible: true })}
              >
                <SD.CardContainer style={{ width, height }}>
                  {mathCategory.includes(item.category) ? (
                    <CardView card={item} />
                  ) : (
                    [
                      <SD.CardViewDetail>{item.name}</SD.CardViewDetail>,
                      this.props.state.config.showBody && (
                        <CardView card={item} />
                      ),
                    ]
                  )}
                </SD.CardContainer>
              </RN.TouchableWithoutFeedback>
            )}
          />
        </RN.View>
      </RN.View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  updateConfig: Action.updateConfig,
  cardSwipeUp: Action.cardSwipeUp,
  cardSwipeDown: Action.cardSwipeDown,
  cardSwipeLeft: Action.cardSwipeLeft,
  cardSwipeRight: Action.cardSwipeRight,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(View);
