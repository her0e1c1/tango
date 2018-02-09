import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import { withTheme } from 'styled-components';
import { connect } from 'react-redux';
import ProgressBar from './progressBar';
import CardView from './cardView';
import MasteredCircle from './masteredCircle';
import * as SD from './styled';
import * as I from 'src/interface';
import CardDetail from './cardDetail';
import { mathCategory } from './cardView';

@withTheme
class View extends React.Component<Props & AppContext, { visible: boolean }> {
  constructor(props) {
    super(props);
    this.state = { visible: false };
  }
  render() {
    if (this.props.cards.length <= this.props.state.nav.index) {
      return null;
    }
    const window = RN.Dimensions.get('window');
    const width = window.width - 20; // HOTFIX: may fix Swiper width?
    const height = window.height * (3 / 4);
    return this.state.visible ? (
      <CardDetail onLongPress={() => this.setState({ visible: false })} />
    ) : (
      <RN.View style={{ flex: 1 }}>
        <ProgressBar />
        <RN.View style={{ marginTop: 5 }}>
          {/* I think DeckSwiper position is absolute */}
          <DeckSwiper
            // backgroundColor={this.props.theme.cardBackgroundColor}
            cardIndex={this.props.state.nav.index}
            swipeAnimationDuration={100}
            onSwipedRight={() => this.props.cardSwipeRight()}
            onSwipedLeft={() => this.props.cardSwipeLeft()}
            onSwipedTop={index => this.props.cardSwipeUp()}
            onSwipedBottom={() => this.props.cardSwipeDown()}
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
            onSwipedAll={() => this.props.goBack()}
            disableBottomSwipe={false}
            marginBottom={0}
            cardVerticalMargin={10}
            cardHorizontalMargin={0}
            cards={this.props.cards}
            showSecondCard={false}
            zoomFriction={0}
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
                  <RN.View style={{ flexDirection: 'row' }}>
                    <MasteredCircle card={item} />
                    {item.category && (
                      <SD.CardCategory>{item.category}</SD.CardCategory>
                    )}
                  </RN.View>
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

const mapStateToProps = (state: RootState) => ({
  state,
  cards: Action.getCurrentCardList(state),
});
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  updateConfig: Action.updateConfig,
  goTo: Action.goTo,
  goBack: Action.goBack,
  cardSwipeUp: Action.cardSwipeUp,
  cardSwipeDown: Action.cardSwipeDown,
  cardSwipeLeft: Action.cardSwipeLeft,
  cardSwipeRight: Action.cardSwipeRight,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(View);