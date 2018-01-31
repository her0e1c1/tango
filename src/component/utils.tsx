import * as React from 'react';
import * as RN from 'react-native';

export const LoadingIcon = () => (
  <RN.View
    style={{
      flex: 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      backgroundColor: 'rgba(#333a)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <RN.ActivityIndicator size="large" animating={true} />
  </RN.View>
);
