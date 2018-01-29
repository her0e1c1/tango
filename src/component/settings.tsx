import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as I from 'src/interface';
import { settings } from 'cluster';

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  update: Action.updateConfig,
  shuffle: Action.shuffleCardsOrSort,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;

export class Settings extends React.Component<Props, {}> {
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
          onValueChange={v =>
            this.props.update({ start: parseInt(String(1000 * v)) })
          }
        />
        <RN.Text>theme {config.theme}</RN.Text>
        <RN.Picker
          selectedValue={config.theme}
          onValueChange={theme => this.props.update({ theme })}
        >
          {['default', 'dark'].map(x => <RN.Picker.Item label={x} value={x} />)}
        </RN.Picker>
      </RN.View>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Settings);
