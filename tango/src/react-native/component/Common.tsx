import * as React from "react";
import * as RN from "react-native";

export const TouchableOpacity = (props: {
  onPress?: () => void;
  children: any;
}) => {
  return props.onPress ? (
    <RN.TouchableOpacity onPress={props.onPress}>
      {props.children}
    </RN.TouchableOpacity>
  ) : (
      props.children
    );
};
export const LoadingIcon = React.memo(
  (props: { isLoadingNoAction?: boolean }) => {
    const style1 = {
      position: "absolute",
      zIndex: 1,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    };
    const style2 = {
      position: "absolute",
      zIndex: 1,
      top: "45%",
      left: "45%",
    };
    return (
      <RN.View style={props.isLoadingNoAction ? style1 : (style2 as any)}>
        <RN.ActivityIndicator size="large" animating={true} />
      </RN.View>
    );
  }
);

export const Overlay = (props: {
  width?: number;
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  inside?: boolean;
  color?: string;
  onPress?: Callback;
  onLongPress?: Callback;
  children?: any;
  style?: any;
  noFeedback?: boolean;
}) => {
  const width = props.width ?? 50;
  return (
    <RN.TouchableOpacity
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={{
        position: "absolute",
        width: props.left || props.right ? width : undefined,
        height: props.bottom || props.top ? width : undefined,
        backgroundColor: props.color ?? "transparent",
        left: props.inside ? width : props.right ? undefined : 0,
        right: props.inside ? width : props.left ? undefined : 0,
        top: props.inside ? width : props.bottom ? undefined : 0,
        bottom: props.inside ? width : props.top ? undefined : 0,
        zIndex: 1,
        ...props.style,
      }}
    >
      {props.children}
    </RN.TouchableOpacity>
  );
};
