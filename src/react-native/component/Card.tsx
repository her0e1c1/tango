import * as React from "react";
import * as RN from "react-native";
import * as NB from "native-base";
import * as AssetUtils from "expo-asset-utils";
import * as FileSystem from "expo-file-system";
import { WebView } from "react-native-webview";
import Slider from "@react-native-community/slider";

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

const generateMessage = (props: { text: string; category?: string }) => {
  const msg = `window.postMessage(JSON.stringify(${JSON.stringify(props)}))`;
  // for debugging
  // console.log("generateMessage: ", msg)
  return msg;
};

// Android crashes if view wraps webview
// https://github.com/react-native-webview/react-native-webview/issues/811
// Also, loading local files still has a problem
// https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md#loading-local-html-files
export const WebviewCard = React.memo(
  (props: { category?: string; text: string }) => {
    const { category, text } = props;
    const ref = React.useRef<WebView>(null);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
      if (ref.current) {
        ref.current.postMessage(JSON.stringify({ text, category }));
      }
    }, [text, category, loaded]);

    const onLoad = React.useCallback(() => setLoaded(true), []);

    return (
      <NB.View renderToHardwareTextureAndroid={true} style={{ flex: 1 }}>
        <WebView
          ref={ref}
          onLoadEnd={onLoad}
          style={{ flex: 1 }}
          automaticallyAdjustContentInsets={false}
          // Android does not show the first message to post
          injectedJavaScript={
            RN.Platform.OS === "android"
              ? generateMessage({ text, category })
              : ""
          }
          bounces={false}
          cacheEnabled
          scrollEnabled
          javaScriptEnabled
          allowFileAccess
          source={{ uri: "https://tang04mem0.web.app/" }}
          androidHardwareAccelerationDisabled={true}
        />
      </NB.View>
    );
  }
);

export const Controller = (props: {
  deckCurrentIndex: number;
  cardsLength: number;
  pause?: boolean;
  onPlay?: Callback;
  onSlidingComplete?: (n: number) => any;
}) => {
  const [index, setIndex] = React.useState(props.deckCurrentIndex);
  React.useEffect(() => {
    setIndex(props.deckCurrentIndex);
  }, [props.deckCurrentIndex]);
  return (
    // not sure but on android, you need to set bg because backText is displayed
    <NB.View style={{ flexDirection: "row", backgroundColor: "white" }}>
      <NB.Button transparent onPress={props.onPlay}>
        <NB.Icon
          name={props.pause ? "md-pause" : "md-play"}
          style={{ margin: 5 }}
        />
      </NB.Button>
      <NB.View style={{ flex: 1, paddingRight: 10 }}>
        <Slider
          style={{ flex: 1 }}
          value={index}
          step={1}
          minimumValue={0}
          maximumValue={props.cardsLength - 1}
          onValueChange={setIndex}
          onSlidingComplete={props.onSlidingComplete}
        />
      </NB.View>
      <RN.View style={{ paddingRight: 10, justifyContent: "center" }}>
        <RN.Text>
          {index + 1} / {props.cardsLength}
        </RN.Text>
      </RN.View>
    </NB.View>
  );
};
