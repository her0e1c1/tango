import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import DeckSwiper from 'react-native-deck-swiper';

const DEBUG = false;
const COLOR = (color, type) => {
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
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>

<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
});
</script>
</head>

<body style="background-color: black">
<pre><code className="golang">%%%</code></pre>
</body>

</html>
`;

export const CardView = ({ item }) => (
  <RN.WebView
    automaticallyAdjustContentInsets={false}
    scrollEnabled={false}
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

export default class View extends React.Component<
  { item: Card },
  { visible: boolean; showBody: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { visible: false, item: null, index: 0, showBody: false };
  }
  componentDidMount() {
    RN.StatusBar.setHidden(true);
  }
  render() {
    const disable = this.state.visible;
    return (
      <RN.View style={{ flex: 1 }}>
        <RN.View style={{ flex: 1 }}>
          <DeckSwiper
            style={{ flex: 1 }}
            backgroundColor={COLOR('yellow')}
            cardIndex={this.state.index}
            swipeAnimationDuration={100}
            onSwipedRight={index => this.setState({ index: index + 1 })}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            cards={this.props.items}
            showSecondCard={false}
            goBackToPreviousCardOnSwipeLeft={true}
            zoomFriction={0}
            onSwipedBottom={() => this.props.onClose()}
            disableBottomSwipe={false}
            renderCard={item => (
              <RN.TouchableWithoutFeedback
                style={{ flex: 1 }}
                onPress={() =>
                  this.setState({ showBody: !this.state.showBody })
                }
                onLongPress={() => this.setState({ visible: true })}
              >
                <RN.View style={{ flex: 1, backgroundColor: COLOR('#621') }}>
                  <CardViewDetail item={item} />
                  {this.state.showBody && <CardView item={item} />}
                </RN.View>
              </RN.TouchableWithoutFeedback>
            )}
          />
        </RN.View>
        <RN.Modal
          animationType={'fade'}
          supportedOrientations={['portrait', 'landscape']}
          visible={this.state.visible}
          onRequestClose={() => {}}
        >
          <RN.TouchableWithoutFeedback
            style={{ flex: 1, backgroundColor: 'black' }}
            // onPress={() => {}}
            onLongPress={() => this.setState({ visible: false })}
          >
            <RN.View style={{ flex: 1, backgroundColor: 'black' }}>
              <CardView item={this.props.items[this.state.index]} />
            </RN.View>
          </RN.TouchableWithoutFeedback>
        </RN.Modal>
      </RN.View>
    );
  }
}
