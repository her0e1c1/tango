import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import * as AssetUtils from "expo-asset-utils";
import * as FileSystem from "expo-file-system";
import { WebView } from "react-native-webview";

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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <NB.Text style={{ fontSize: 24 }}>{props.body}</NB.Text>
    </RN.View>
  </RN.TouchableWithoutFeedback>
);

/*
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
*/

export const WebviewCard = React.memo((props: { refWebView?: any }) => {
  React.useEffect(() => {
    AssetUtils.resolveAsync(require("../../../assets/view/index.html")).then(
      async (file) => {
        const fileContents = await FileSystem.readAsStringAsync(file.localUri);
        setHtml(fileContents);
      }
    );
  }, []);
  const [html, setHtml] = React.useState("");
  return (
    <NB.View renderToHardwareTextureAndroid={true} style={{ flex: 1 }}>
      <WebView
        ref={props.refWebView}
        style={{ flex: 1 }}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        scrollEnabled={true}
        useWebKit
        javaScriptEnabled
        allowFileAccess
        originWhitelist={["*"]}
        source={{ html }}
        androidHardwareAccelerationDisabled={true}
        // source={{ html: html, baseUrl: '' }} // https://github.com/facebook/react-native/issues/18802
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
  // not sure but on android, you need to set bg because backText is displayed
  <NB.View style={{ flexDirection: "row", backgroundColor: "white" }}>
    <NB.Button transparent onPress={props.onPlay}>
      <NB.Icon
        name={props.pause ? "md-pause" : "md-play"}
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
    <RN.View style={{ paddingRight: 10, justifyContent: "center" }}>
      <RN.Text>
        {props.deckCurrentIndex + 1} / {props.cardsLength}
      </RN.Text>
    </RN.View>
  </NB.View>
);
