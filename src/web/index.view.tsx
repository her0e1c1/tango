import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'katex/dist/katex.css';

import { MathView } from './component/card';

class Root extends React.Component {
  state = { data: '' };
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
  render() {
    return (
      <div
        style={{
          fontSize: 18,
          tabSize: 2,
          letterSpacing: 0,
          margin: '0 auto',
          padding: '0 5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <MathView text={this.state.data} />
      </div>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
