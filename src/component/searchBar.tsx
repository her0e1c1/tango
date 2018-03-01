import * as React from 'react';
import * as RN from 'react-native';
import * as NB from 'native-base';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as I from 'src/interface';
import { withNavigation } from 'react-navigation';
import { LoadingIcon } from './utils';
import { BarCodeScanner, Permissions } from 'expo';

export class CodeScanner extends React.Component<{
  onScan: (x: { type?: string; data: string }) => void;
}> {
  state = { hasCameraPermission: null, visible: true };

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === 'granted') {
      this.setState({ hasCameraPermission: true });
    } else {
      await alert('No access to camera');
      this.setState({ visible: false }, () => this.props.onScan({ data: '' }));
    }
  }

  render() {
    if (!this.state.hasCameraPermission) {
      return <LoadingIcon />;
    }
    return (
      <RN.Modal
        visible={this.state.visible}
        animationType={'fade'}
        onRequestClose={() => this.setState({ visible: false })}
      >
        <BarCodeScanner
          onBarCodeRead={data =>
            this.setState({ visible: false }, () => this.props.onScan(data))
          }
          style={RN.StyleSheet.absoluteFill}
        />
      </RN.Modal>
    );
  }
}

@withNavigation
export class _SearchBar extends React.Component<
  ConnectedProps,
  { text: string; showScanner: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { text: '', showScanner: false };
  }

  async onEndEditing() {
    const { dispatch } = this.props;
    const { text } = this.state;
    if (!text) {
      return;
    }
    await dispatch(Action.deck.insertByURL(this.state.text));
    const { errorCode } = this.props.state.config;
    if (errorCode) {
      if (errorCode == 'INVALID_URL') {
        alert('INVALID URL :(');
      } else if (errorCode == 'CAN_NOT_FETCH') {
        alert('CAN NOT FETCH :(');
      } else if (errorCode == 'NO_CARDS') {
        alert('There are not cards in input url');
      }
      dispatch(Action.config.clearError());
    } else {
      this.setState({ text: '' });
    }
  }

  render() {
    return this.state.showScanner ? (
      <CodeScanner
        onScan={({ type, data }) =>
          this.setState({ text: data, showScanner: false }, () =>
            this.onEndEditing()
          )
        }
      />
    ) : (
      <RN.View style={{ flexDirection: 'row' }}>
        <RN.TextInput
          // autoFocus
          keyboardType="url"
          value={this.state.text}
          placeholder="Input your CSV url ..."
          style={{
            backgroundColor: 'white',
            fontSize: 14,
            flex: 1,
            paddingLeft: 15,
            marginRight: 5,
          }}
          onChangeText={text => this.setState({ text })}
          onEndEditing={() => this.onEndEditing()}
        />
        <NB.Button light onPress={() => this.setState({ showScanner: true })}>
          <NB.Icon name="md-qr-scanner" />
        </NB.Button>
      </RN.View>
    );
  }
}
export default connect(state => ({ state }))(_SearchBar);
