import * as NB from 'native-base';
import * as React from 'react';
import { Header as MyHeader } from 'src/react-native/component';
import { useNavigation } from 'react-navigation-hooks';
import { useConfigState } from 'src/hooks/state';
import { useGoBack } from 'src/react-native/hooks/action';

const getStackLength = navigation => {
  try {
    return navigation.dangerouslyGetParent().state.routes.length;
    // return navigation.state.index;
  } catch (e) {
    return 0;
  }
};

export const Header = (props: {
  bodyText?: string;
  rightIcon?: string;
  rightOnPress?: Callback;
  body?: { title: string };
  right?: { onPress: Callback; icon: string };
}) => {
  const navi = useNavigation();
  const config = useConfigState();
  const goBack = useGoBack();
  if (!config.showHeader) return <NB.View />;
  const length = getStackLength(navi);
  let right = props.right;
  if (props.rightIcon && props.rightOnPress) {
    right = { onPress: props.rightOnPress, icon: props.rightIcon };
  }
  return (
    <MyHeader
      body={{ title: (props.body && props.body.title) || props.bodyText || '' }}
      left={length > 1 ? { onPress: goBack } : undefined}
      right={right}
    />
  );
};
