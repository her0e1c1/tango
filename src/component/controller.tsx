import * as Action from 'src/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Selector from 'src/selector';

class _Controller extends React.Component<ConnectedProps, { pause: boolean }> {
  state = { pause: false };
  private goToNextCard: number;
  componentWillUnmount() {
    if (this.goToNextCard) {
      clearInterval(this.goToNextCard);
    }
  }
  render() {
    const { dispatch } = this.props;
    const deck = Selector.getCurrentDeck(this.props.state);
    const cards = Selector.getCurrentCardList(this.props.state);
    if (!deck || cards.length === 0) {
      return <RN.View />;
    }
    return (
      <RN.View style={{ flexDirection: 'row' }}>
        <NB.Button
          transparent
          onPress={() => {
            this.setState({ pause: !this.state.pause }, () => {
              if (this.state.pause) {
                this.goToNextCard = setInterval(() => {
                  if (deck.currentIndex < cards.length - 1) {
                    dispatch(Action.nav.cardSwipeRight(deck.currentIndex));
                  } else {
                    this.setState({ pause: false });
                    clearInterval(this.goToNextCard);
                  }
                }, this.props.state.config.cardInterval * 1000);
              } else {
                clearInterval(this.goToNextCard);
              }
            });
          }}
        >
          <NB.Icon
            name={this.state.pause ? 'md-pause' : 'md-play'}
            style={{ margin: 5 }}
          />
        </NB.Button>
        <RN.View style={{ flex: 1, paddingRight: 10 }}>
          <RN.Slider
            style={{ flex: 1 }}
            value={deck.currentIndex}
            step={1}
            minimumValue={0}
            maximumValue={cards.length - 1}
            onSlidingComplete={v =>
              dispatch(Action.nav.goToCardByIndex(deck, Math.floor(v)))
            }
          />
        </RN.View>
      </RN.View>
    );
  }
}
export const Controller = connect(state => ({ state }))(_Controller);
