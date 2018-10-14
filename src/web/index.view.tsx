import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'katex/dist/katex.css';
import Highlight from 'react-highlight';

import * as C from 'src/constant';
import { MathView } from './component/card';

class Root extends React.Component {
  theme: string;
  category: string | null;
  state = { data: '' };
  constructor(props) {
    super(props);
    const params = new URLSearchParams(location.search);
    this.category = params.get('category');
    this.theme = params.get('theme') || 'default';
    if (this.theme === 'dark') {
      require(`highlight.js/styles/dark.css`);
    } else {
      require(`highlight.js/styles/default.css`);
    }
  }
  componentDidMount() {
    // postMessage works with window.addEventListener("message", ...)
    // postMessage("string", location.origin)
    // on react native, you need to use document instead
    document.addEventListener(
      'message',
      event => {
        __DEV__ && console.log('DEBUG MESSAGE: ', event);
        // @ts-ignore
        const data = event.data;
        // webpack also sends message which is not string but object
        if (typeof data === 'string') this.setState({ data });
      },
      false
    );
  }
  renderData() {
    const c = this.category;
    if (c === 'math') {
      return <MathView text={this.state.data} />;
    } else if (C.LANGUAGES.includes(c || '')) {
      return <Highlight className={c}>{this.state.data}</Highlight>;
    } else {
      return this.state.data;
    }
  }
  render() {
    return (
      <div
        style={{
          fontSize: 18,
          tabSize: 2,
          letterSpacing: 0,
          overflow: 'scroll',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        {this.renderData()}
      </div>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
