import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import DeckSwiper from 'react-native-deck-swiper';

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

export default class View extends React.Component<
  { item: Card },
  { visible: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { visible: true, item: null };
  }
  render() {
    const disable = this.state.visible;
    return (
      <DeckSwiper
        backgroundColor={'black'}
        swipeAnimationDuration={100}
        onTapCard={() => this.setState({ visible: true })}
        cardVerticalMargin={0}
        cardHorizontalMargin={0}
        cards={this.props.items}
        showSecondCard={true}
        goBackToPreviousCardOnSwipeLeft={true}
        zoomFriction={0}
        renderCard={item => (
          <RN.View style={{ flex: 1 }}>
            <RN.Button
              title={this.state.visible ? 'ON' : 'OFF'}
              onPress={() => this.setState({ visible: true })}
            />
            <RN.View style={{ flex: 1 }}>
              <RN.WebView
                automaticallyAdjustContentInsets={false}
                source={{ html: html.replace('%%%', item.body) }}
                style={{ backgroundColor: 'black' }}
              />
            </RN.View>
            <RN.Modal
              // transparent
              animationType={'fade'}
              supportedOrientations={['portrait', 'landscape']}
              visible={this.state.visible}
              onRequestClose={() => {}}
            >
              <RN.Button
                title="CLOSING ON MODAL"
                onPress={() => this.setState({ visible: false })}
              />
            </RN.Modal>
          </RN.View>
        )}
      />
    );
  }
}

/*

          <RN.TouchableHighlight
            style={{ flex: 1 }}
            onPress={() => alert('hi')}
            onLongPress={() => this.setState({ visible: true })}
          >
            <RN.View style={{ flex: 1 }}>
              <RN.Button title="CLOSING" onPress={() => this.props.onClose()} />
            </RN.View>
          </RN.TouchableHighlight>


        <RN.TouchableHighlight
          style={{ flex: 1 }}
          onLongPress={() => this.setState({ visible: true })}
        >
        </RN.TouchableHighlight>
          <RN.TouchableOpacity
            style={{ flex: 1 }}
            onLongPress={() => this.setState({ visible: false })}
          >
          </RN.TouchableOpacity>

*/
