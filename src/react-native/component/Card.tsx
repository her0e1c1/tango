import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';

export const TextCard = (props: {
  body: string;
  onPress?: Callback;
  onLongPress?: Callback;
}) => (
  <RN.TouchableWithoutFeedback
    onPress={props.onPress}
    onLongPress={props.onLongPress}
  >
    <RN.View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <NB.Text style={{ fontSize: 24 }}>{props.body}</NB.Text>
    </RN.View>
  </RN.TouchableWithoutFeedback>
);

const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, user-scalable=yes" />
<link href="https://tang04mem0.firebaseapp.com/static/css/main.68baa116.css" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
 <script src="https://tang04mem0.firebaseapp.com/static/js/main.00ed006a.js"></script>
</html>
`;

export const WebviewCard = React.memo((props: { refWebView?: any }) => {
  return (
    <NB.View style={{ flex: 1 }}>
      <RN.WebView
        ref={props.refWebView}
        style={{ flex: 1 }}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        scrollEnabled={true}
        source={{ html: html, baseUrl: '' }} // https://github.com/facebook/react-native/issues/18802
        originWhitelist={['*']}
      />
    </NB.View>
  );
});

export const Controller = (props: {
  deckCurrentIndex: number;
  cardsLength: number;
  pause?: boolean;
  onPlay?: Callback;
  onSlidingComplete?: (n: number) => any;
}) => (
  <NB.View style={{ flexDirection: 'row' }}>
    <NB.Button transparent onPress={props.onPlay}>
      <NB.Icon
        name={props.pause ? 'md-pause' : 'md-play'}
        style={{ margin: 5 }}
      />
    </NB.Button>
    <NB.View style={{ flex: 1, paddingRight: 10 }}>
      <RN.Slider
        style={{ flex: 1 }}
        value={props.deckCurrentIndex}
        step={1}
        minimumValue={0}
        maximumValue={props.cardsLength - 1}
        onSlidingComplete={props.onSlidingComplete}
      />
    </NB.View>
    <RN.View style={{ paddingRight: 10, justifyContent: 'center' }}>
      <RN.Text>
        {props.deckCurrentIndex + 1} / {props.cardsLength}
      </RN.Text>
    </RN.View>
  </NB.View>
);
