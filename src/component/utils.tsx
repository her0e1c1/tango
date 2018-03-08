import * as React from 'react';
import * as RN from 'react-native';

export const LoadingIcon = () => (
  <RN.View
    style={{
      position: 'absolute',
      top: '45%',
      left: '45%',
      zIndex: 1,
    }}
  >
    <RN.ActivityIndicator size="large" animating={true} />
  </RN.View>
);

export const ErrorPage = () => <RN.View>ERROR! Something wrong :(</RN.View>;
