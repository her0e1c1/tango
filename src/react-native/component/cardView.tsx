import * as React from 'react';
import * as RN from 'react-native';
import { withTheme } from 'styled-components';
import { connect } from 'react-redux';

class _CardView extends React.Component<
  {
    body: string;
    category?: string | null;
    center?: boolean;
    convertToBr?: boolean;
  } & ConnectedProps &
    AppContext,
  {}
> {
  webView: RN.WebView | null;
  render() {
    const body = this.props.body || '';
    return !this.props.category || body.trim() === '' ? (
      <RN.View
        style={{
          flex: 1,

          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}
      >
        <RN.Text style={{ fontSize: 24 }}>{this.props.body}</RN.Text>
      </RN.View>
    ) : (
      <RN.WebView
        style={{ flex: 1 }}
        automaticallyAdjustContentInsets={false}
        bounces={false}
        scrollEnabled={true}
        ref={r => (this.webView = r)}
        onLoadEnd={() => {
          this.webView!.postMessage(JSON.stringify({ text: this.props.body }));
        }}
        source={{
          uri: `https://tang04mem0.firebaseapp.com/view?category=${
            this.props.category
          }`,
        }}
      />
    );
  }
}
export const CardView = withTheme(connect(state => ({ state }))(_CardView));
