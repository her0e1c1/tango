import * as React from 'react';
import * as NB from 'native-base';
import * as RN from 'react-native';
import styled from 'styled-components/native';

export const CenteredView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f5fcff;
`;

const Content = styled(NB.Content)`
  flex: 1;
  margin-top: 20;
  background-color: #f5fcff;
`;

export const Container = props => (
  <NB.Container style={{ backgroundColor: '#f5fcff' }}>
    <RN.ScrollView>
      <Content {...props} />
    </RN.ScrollView>
  </NB.Container>
);

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
      position: 'absolute',
      zIndex: 1,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    };
    const style2 = {
      position: 'absolute',
      zIndex: 1,
      top: '45%',
      left: '45%',
    };
    return (
      <RN.View style={props.isLoadingNoAction ? style1 : (style2 as any)}>
        <RN.ActivityIndicator size="large" animating={true} />
      </RN.View>
    );
  }
);

export const Center = props => (
  <NB.View
    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    {...props}
  />
);

export const Overlay = (props: {
  width?: number;
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
  color?: string;
  onPress?: Callback;
  onLongPress?: Callback;
  children?: any;
  style?: any;
  noFeedback?: boolean;
}) => {
  return (
    <RN.TouchableOpacity
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={{
        position: 'absolute',
        width: props.left || props.right ? props.width || 50 : undefined,
        height: props.bottom || props.top ? props.width || 50 : undefined,
        backgroundColor: props.color,
        left: props.right ? undefined : 0,
        right: props.left ? undefined : 0,
        top: props.bottom ? undefined : 0,
        bottom: props.top ? undefined : 0,
        zIndex: 1,
        ...props.style,
      }}
    >
      {props.children}
    </RN.TouchableOpacity>
  );
};
