import * as Action from 'src/react-native/action';
import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import { getSelector } from 'src/selector';

class _Controller extends React.Component<ConnectedProps, { pause: boolean }> {
  state = { pause: false };
  private interval: number;
  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  render() {
    const { dispatch } = this.props;
    const selector = getSelector(this.props.state);
    const deck = selector.deck.current;
    const cards = selector.card.currentList;
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
                this.interval = setInterval(() => {
                  if (deck.currentIndex < cards.length - 1) {
                    dispatch(Action.cardSwipeRight());
                  } else {
                    this.setState({ pause: false });
                    clearInterval(this.interval);
                  }
                }, this.props.state.config.cardInterval * 1000);
              } else {
                clearInterval(this.interval);
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
              dispatch(Action.goToCardByIndex(deck, Math.floor(v)))
            }
          />
        </RN.View>
        <RN.View style={{ paddingRight: 10, justifyContent: 'center' }}>
          <RN.Text>
            {deck.currentIndex + 1} / {cards.length}
          </RN.Text>
        </RN.View>
      </RN.View>
    );
  }
}
export const Controller = connect(state => ({ state }))(_Controller);
