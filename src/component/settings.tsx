import * as React from 'react';
import * as RN from 'react-native';

const Settings = () => (
  <RN.View style={{ flex: 1, backgroundColor: '#123' }}>
    <RN.Button
      title="CLEAR CACHE"
      onPress={() => {
        RN.Alert.alert('Are you sure?', '', [
          { text: 'OK', onPress: () => RN.AsyncStorage.clear() }, // TODO: update component
          { text: 'Cancel', onPress: () => {} },
        ]);
      }}
    />
  </RN.View>
);
export default Settings;
