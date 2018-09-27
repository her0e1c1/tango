import * as React from 'react';
import * as RN from 'react-native';
import { withTheme } from 'styled-components';
import { connect } from 'react-redux';

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
  getStyle(): string {
    const { theme } = this.props;
    let common = `
    color: ${theme.mainColor};
    background-color: ${theme.cardBackgroundColor};
    font-size: 18px;
    tab-size: 2;
    letter-spacing: 0px; 
    margin: 0 auto;
    padding: 0 5px;

    display: flex;
    align-items: center;
    justify-content: center;
    `;
    return common;
  }
  getBody(): string {
    const { body, category } = this.props;
    let b = body;
    if (this.props.convertToBr) {
      b = b.replace(/\n\n/g, '<br/>');
      b = b.replace(/\$\$/g, '$$$$$$$$'); // $ is a escape char
    }
    if (category) {
      if (category in mappingCategory) {
        const lang = mappingCategory[category];
        return `
        <body style="${this.getStyle()}">
          <div style="overflow: scroll;">
            <pre><code className="${lang}">${b}</code></pre>
          </div>
        </body>`;
      } else if (mathCategory.includes(category)) {
        return `
        <body style="${this.getStyle()}">
          <div style="overflow: scroll;">${b}</div>
        </body>`;
      } else if (['raw'].includes(category)) {
        return `<body style="${this.getStyle()}">${b}</body>`;
      }
    }
    return `
    <body style="${this.getStyle()}">
      <div style="overflow: scroll;">
        <pre>${b}</pre>
      </div>
    </body>`;
  }
  render() {
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
export const CardView = withTheme(connect(state => ({ state }))(_CardView));
export default CardView;
