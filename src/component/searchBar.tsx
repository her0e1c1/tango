import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';
import * as I from 'src/interface';

export class SearchBar extends React.Component<Props, { text: string }> {
  constructor(props) {
    super(props);
    this.state = { text: '' };
  }
  render() {
    return (
      <RN.View style={{ flexDirection: 'row' }}>
        <RN.TextInput
          // autoFocus
          keyboardType="url"
          value={this.state.text}
          placeholder="Input your CSV url ..."
          style={{ backgroundColor: 'white', fontSize: 14, flex: 1, paddingLeft: 15 }}
          onChangeText={text => this.setState({ text })}
          onEndEditing={async () => {
            await this.props.insertByURL(this.state.text);
            const { errorCode } = this.props.state.config;
            if (errorCode) {
              if (errorCode == 'INVALID_URL') {
                alert('INVALID URL :(');
              } else if (errorCode == 'CAN_NOT_FETCH') {
                alert('CAN NOT FETCH :(');
              } else if (errorCode == 'NO_CARDS') {
                alert('There are not cards in input url');
              }
              this.props.clearError();
            } else {
              this.setState({ text: '' });
            }
          }}
        />
        <RN.Button
          title="Q"
          color="#841584"
          onPress={() => alert('implement later :)')}
        />
      </RN.View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {
  insertByURL: Action.tryInsertByURL,
  clearError: Action.clearError,
};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
