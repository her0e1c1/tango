import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';

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
    this.state = { visible: true };
  }
  render() {
    const code = this.props.item.body;
    return (
      <RN.View style={{ flex: 1 }}>
        <RN.Button title={this.state.visible ? 'ON' : 'OFF'} />
        <RN.View style={{ flex: 1 }}>
          <RN.WebView
            automaticallyAdjustContentInsets={false}
            source={{ html: html.replace('%%%', code) }}
          />
        </RN.View>
        <RN.Modal
          transparent
          supportedOrientations={['portrait', 'landscape']}
          visible={this.state.visible}
          onRequestClose={() => {}}
        >
          <RN.View style={{ flex: 1 }}>
            <RN.Button title="CLOSING" onPress={() => this.props.onClose()} />
          </RN.View>
        </RN.Modal>
      </RN.View>
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
