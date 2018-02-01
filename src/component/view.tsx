import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import DeckSwiper from 'react-native-deck-swiper';
import styled, { withTheme } from 'styled-components';
import { connect } from 'react-redux';
import ProgressBar from './progressBar';
import CardView from './cardView';
import * as SD from './styled';

const DEBUG = false;

const COLOR = (color, type?) => {
  if (DEBUG) {
    return color;
  }
  if (type === 'word') {
    return '#fff';
  }
  return 'black';
};

@(connect(
  (state: RootState) => ({
    card: Action.getCurrentCard(state),
    nav: state.nav,
  }),
  {
    goTo: Action.goTo,
    goToNextCard: Action.goToNextCard,
    goToPrevCard: Action.goToPrevCard,
  }
) as any)
class CardViewFocus extends React.Component<
  { onLongPress: Callback; card: Card },
  {}
> {
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  componentWillUnmount() {
    RN.StatusBar.setHidden(false);
  }
  render() {
    const window = RN.Dimensions.get('window');
    const height = window.height;
    return (
      <RN.Modal
        animationType={'none'}
        supportedOrientations={['portrait', 'landscape']}
        visible={true}
        onRequestClose={() => {}}
      >
        <RN.TouchableWithoutFeedback
          style={{ flex: 1, backgroundColor: 'black' }}
          onLongPress={this.props.onLongPress}
        >
          <RN.View style={{ flex: 1, backgroundColor: 'black' }}>
            <CardView card={this.props.card} />
            <SD.SideControl
              style={{ left: 0, height }}
              onPress={() => this.props.goToPrevCard()}
              onLongPress={() => alert(JSON.stringify(this.props.nav))}
            />
            <SD.SideControl
              style={{ right: 0, height }}
              onPress={() => this.props.goToNextCard()}
              onLongPress={() => alert(JSON.stringify(this.props.card.name))}
            />
          </RN.View>
        </RN.TouchableWithoutFeedback>
      </RN.Modal>
    );
  }
}

@withTheme
@connect(
  (state: RootState) => ({
    index: state.nav.index,
    cards: Action.getCurrentCardList(state),
  }),
  {
    goTo: Action.goTo,
    goBack: Action.goBack,
    toggle: Action.toggleMastered,
  }
)
export default class View extends React.Component<
  AppContext,
  { visible: boolean; showBody: boolean }
> {
  // static contextTypes = { theme: PropTypes.func };
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      showBody: false,
    };
  }
  render() {
    const window = RN.Dimensions.get('window');
    const width = window.width - 20; // HOTFIX: may fix Swiper width?
    return this.state.visible ? (
      <CardViewFocus onLongPress={() => this.setState({ visible: false })} />
    ) : (
      <RN.View style={{ flex: 1 }}>
        <DeckSwiper
          backgroundColor={this.props.theme.cardBackgroundColor}
          cardIndex={this.props.index}
          swipeAnimationDuration={100}
          onSwipedRight={index => this.props.goTo({ index: index + 1 })}
          onSwipedLeft={index => this.props.goTo({ index: index - 1 })}
          onSwipedTop={async index => {
            await this.props.toggle(this.props.cards[this.props.index]);
            await this.props.goTo({ index: index + 1 });
          }}
          disableBottomSwipe={false}
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          cards={this.props.cards}
          showSecondCard={false}
          goBackToPreviousCardOnSwipeLeft={true}
          zoomFriction={0}
          onSwipedBottom={() => this.props.goBack()}
          renderCard={(
            item = {} as Card // Sometimes item is undefined :(
          ) => (
            <RN.TouchableWithoutFeedback
              onPress={() => this.setState({ showBody: !this.state.showBody })}
              onLongPress={() => this.setState({ visible: true })}
            >
              <SD.CardContainer style={{ width }}>
                <SD.CardViewDetail>{item.name}</SD.CardViewDetail>
                {this.state.showBody && <CardView card={item} />}
              </SD.CardContainer>
            </RN.TouchableWithoutFeedback>
          )}
        />
      </RN.View>
    );
  }
}
