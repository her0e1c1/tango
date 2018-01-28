import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';

@connect((state: RootState) => ({ state }), {
  update: Action.updateConfig,
  shuffle: Action.shuffleCardsOrSort,
})
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
        <RN.Text>Shuffle</RN.Text>
        <RN.Button
          title={config.shuffled ? 'ON' : 'OFF'}
          onPress={async () => {
            await this.props.update({ shuffled: !config.shuffled });
            await this.props.shuffle();
          }}
        />
        <RN.Text>Start {config.start}</RN.Text>
        <RN.Slider
          minimumValue={0}
          value={config.start / 1000}
          onValueChange={v => this.props.update({ start: parseInt(1000 * v) })}
        />
      </RN.View>
    );
  }
}
export default Settings;
