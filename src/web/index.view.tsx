import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'katex/dist/katex.css';
var Latex = require('react-latex'); // TODO: Create a parser

class Root extends React.Component {
  state = { data: '' };
  componentDidMount() {
    // You can fire the `message` event on browser directly
    // postMessage("string", location.origin)
    window.addEventListener('message', message => {
      __DEV__ && console.log('DEBUG MESSAGE: ', message);
      // webpack also sends message which is not string but object
      const data = message.data;
      if (typeof data === 'string') this.setState({ data });
    });
  }
  render() {
    return (
      <div>
        <Latex>{this.state.data}</Latex>
      </div>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
