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
    return <MathView text={this.state.data} />;
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
