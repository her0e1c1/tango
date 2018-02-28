import * as React from 'react';
import * as RN from 'react-native';
import { withTheme } from 'styled-components';
import { connect } from 'react-redux';
import * as SD from './styled';
import * as I from 'src/interface';

const html = `
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, user-scalable=yes" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/styles/{THEME}.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.6/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML"></script>
<script type="text/x-mathjax-config">
MathJax.Hub.Config({
  tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
});
</script>
</head>{BODY}</html>
`;

export const mathCategory = ['math', 'tex', 'latex'];
const mappingCategory = {
  c: 'c',
  py: 'python',
  python: 'python',
  go: 'golang',
  golang: 'golang',
  hs: 'haskell',
  haskell: 'haskell',
};
const knownCategory = mathCategory.concat(Object.keys(mappingCategory));

class CardView extends React.Component<
  Props & { card: Card } & AppContext,
  {}
> {
  getStyle() {
    const { theme } = this.props;
    return `
    background-color: ${theme.cardBackgroundColor};
    color: ${theme.mainColor};
    font-size: 18px;
    tab-size: 2;
    letter-spacing: 0px; 
    margin: 0;
    padding: 0 5px;
    `;
  }
  getBody(): string {
    const { card } = this.props;
    const { name, body } = card;
    if (card.category in mappingCategory) {
      const lang = mappingCategory[card.category];
      return `<body style="${this.getStyle()}"><pre style="tab-size:2;"><code style="${this.getStyle()}" className="${lang}">${body}</code></pre></body>`;
    } else if (mathCategory.includes(card.category)) {
      if (this.props.state.config.showBody) {
        return `<body style="${this.getStyle()}">${name}<br/>${body}</body>`;
      } else {
        return `<body style="${this.getStyle()}">${name}</body>`;
      }
    } else {
      return `<body style="${this.getStyle()}"><pre>${body}</pre></body>`;
    }
  }
  render() {
    const { card } = this.props;
    if (!knownCategory.includes(card.category)) {
      return (
        <RN.ScrollView // doesn't work
          style={{
            flex: 1,
            backgroundColor: this.props.theme.cardBackgroundColor,
          }}
        >
          <SD.BodyText>{card.body}</SD.BodyText>
        </RN.ScrollView>
      );
    }
    return (
      <RN.WebView
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        bounces={false}
        source={{
          html: html
            .replace('{BODY}', this.getBody())
            .replace('{THEME}', this.props.state.config.theme),
        }}
        style={{
          backgroundColor: this.props.theme.cardBackgroundColor,
        }}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => ({ state });
const _mapStateToProps = I.returntypeof(mapStateToProps);
const mapDispatchToProps = {};
type Props = typeof _mapStateToProps & typeof mapDispatchToProps;
export default withTheme(
  connect(mapStateToProps, mapDispatchToProps)(CardView)
);
