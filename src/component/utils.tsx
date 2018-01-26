import * as React from 'react';
import * as RN from 'react-native';

const LoadingIcon = () => (
  <RN.Modal transparent>
    <RN.View
      style={{
        flex: 1,
        backgroundColor: 'rgba(#333a)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <RN.ActivityIndicator size="large" animating={true} />
    </RN.View>
  </RN.Modal>
);
