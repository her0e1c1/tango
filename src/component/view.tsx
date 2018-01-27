import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import DeckSwiper from 'react-native-deck-swiper';
import PinchZoomView from 'react-native-pinch-zoom-view';

const DEBUG = true;
const COLOR = (color, type?) => {
  if (DEBUG) {
    return color;
  }
  if (type === 'word') {
    return '#fff';
  }
  return 'black';
};

const html = `
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, user-scalable=yes" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/styles/dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>

<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
});
</script>
</head>

<body style="background-color: black; font-size: 18px">
<pre><code className="golang">%%%</code></pre>
</body>

</html>
`;

export const CardView = ({ item }) => (
  <RN.WebView
    automaticallyAdjustContentInsets={false}
    scrollEnabled={true}
    bounces={false}
    source={{ html: html.replace('%%%', item.body) }}
    style={{ backgroundColor: COLOR('pink') }}
  />
);

const CardViewDetail = ({ item }) => (
  <RN.View style={{}}>
    <RN.Text style={{ color: COLOR('red', 'word'), fontSize: 25 /*config*/ }}>
      {item.name}
    </RN.Text>
  </RN.View>
);

const CardViewFocus = ({ item, onLongPress }) => (
  <RN.Modal
    animationType={'none'}
    supportedOrientations={['portrait', 'landscape']}
    visible={true}
    onRequestClose={() => {}}
  >
    <RN.TouchableWithoutFeedback
      style={{ flex: 1, backgroundColor: 'black' }}
      // onPress={() => {}}
      onLongPress={onLongPress}
    >
      <RN.View style={{ flex: 1, backgroundColor: 'black' }}>
        <CardView item={item} />
      </RN.View>
    </RN.TouchableWithoutFeedback>
  </RN.Modal>
);

@connect(
  (state: RootState) => ({
    card: state.card,
    item: state.nav.card,
    deck: state.nav.deck,
    index: state.nav.index,
  }),
  {
    goTo: Action.goTo,
    goBack: Action.goBack,
  }
)
export default class View extends React.Component<
  {},
  { visible: boolean; showBody: boolean; item: Card }
> {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      showBody: false,
    };
  }
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  componentWillUnmount() {
    RN.StatusBar.setHidden(false);
  }
  render() {
    const ids = this.props.card.byDeckId[this.props.deck.id] || [];
    const cards = ids.map(id => this.props.card.byId[id]).slice(0, 200);
    const disable = this.state.visible;
    return !this.state.visible ? (
      <RN.View style={{ flex: 1 }}>
        <DeckSwiper
          backgroundColor={COLOR('yellow')}
          cardIndex={this.props.index}
          swipeAnimationDuration={100}
          onSwipedRight={index => this.props.goTo({ index: index + 1 })}
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          cards={cards}
          showSecondCard={false}
          goBackToPreviousCardOnSwipeLeft={true}
          zoomFriction={0}
          onSwipedBottom={() => this.props.goBack()}
          disableBottomSwipe={false}
          renderCard={item => (
            <RN.TouchableWithoutFeedback
              onPress={() => this.setState({ showBody: !this.state.showBody })}
              onLongPress={() => this.setState({ visible: true })}
            >
              <RN.View
                style={{
                  flex: 1,
                  backgroundColor: COLOR('#621'),
                }}
              >
                <CardViewDetail item={item} />
              </RN.View>
            </RN.TouchableWithoutFeedback>
          )}
        />
      </RN.View>
    ) : (
      <CardViewFocus
        item={this.props.item}
        onLongPress={() => this.setState({ visible: false })}
      />
    );
  }
}
/*


                {this.state.showBody && <CardView item={item} />}
              */
