import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Action from 'src/action';

export default class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <RN.View style={{ flex: 1, backgroundColor: '#303' }}>
        <RN.WebView
          source={{ html: '<h1>Hello</h1>' }}
          style={{ backgroundColor: 'blue', flex: 1 }}
        />
      </RN.View>
    );
  }
}
