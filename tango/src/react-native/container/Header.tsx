import * as React from 'react';
import { Header as MyHeader } from 'src/react-native/component';
import { useGoBack } from 'src/react-native/hooks/action';
// import { useNavigation } from 'react-navigation-hooks';
import { NavigationContext } from '@react-navigation/native';

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
  bodyOnPress?: Callback;
  rightIcon?: string;
  rightOnPress?: Callback;
  body?: { title: string };
  right?: { onPress: Callback; icon: string };
}) => {
  const navi = React.useContext(NavigationContext);
  // const goBack = useGoBack();
  const length = getStackLength(navi);
  let right = props.right;
  if (props.rightIcon && props.rightOnPress) {
    right = { onPress: props.rightOnPress, icon: props.rightIcon };
  }
  return (
    <MyHeader
      body={{
        title: (props.body && props.body.title) || props.bodyText || '',
        onPress: props.bodyOnPress,
      }}
      left={length > 1 ? { onPress: () => { } } : undefined}
      right={right}
    />
  );
};
