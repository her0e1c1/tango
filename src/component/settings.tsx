import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';

@connect((state: RootState) => ({ state }), { update: Action.updateConfig })
export class Settings extends React.Component<{ state: RootState }, {}> {
  render() {
    const { config } = this.props.state;
    return (
      <RN.View style={{ flex: 1, backgroundColor: 'white' }}>
        <RN.Button
          title="CLEAR CACHE"
          onPress={() => {
            RN.Alert.alert('Are you sure?', '', [
              { text: 'OK', onPress: () => RN.AsyncStorage.clear() }, // TODO: update component
              { text: 'Cancel', onPress: () => {} },
            ]);
          }}
        />
        <RN.Text>Show Mastered Cards</RN.Text>
        <RN.Button
          title={config.showMastered ? 'ON' : 'OFF'}
          onPress={() =>
            this.props.update({
              showMastered: !config.showMastered,
            })
          }
        />
      </RN.View>
    );
  }
}
export default Settings;
