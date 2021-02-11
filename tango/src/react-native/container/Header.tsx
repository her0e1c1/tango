import * as React from "react";
import { Header as MyHeader } from "src/react-native/component";
import { useNavigation } from "@react-navigation/native";

export const Header = (props: {
  bodyText?: string;
  bodyOnPress?: Callback;
  rightIcon?: string;
  rightOnPress?: Callback;
  body?: { title: string };
  right?: { onPress: Callback; icon: string };
}) => {
  const navi = useNavigation();
  const length = navi.dangerouslyGetState().routes.length
  let right = props.right;
  if (props.rightIcon && props.rightOnPress) {
    right = { onPress: props.rightOnPress, icon: props.rightIcon };
  }
  return (
    <MyHeader
      body={{
        title: (props.body && props.body.title) || props.bodyText || "",
        onPress: props.bodyOnPress,
      }}
      left={length > 1 ? { onPress: navi.goBack } : undefined}
      right={right}
    />
  );
};
