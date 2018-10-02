import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'katex/dist/katex.css';
import * as katex from 'katex';

const convert = (text: string) => {
  text = text.replace(/\$\$(.*?)\$\$/g, (_, x) =>
    katex.renderToString(x, { displayMode: true, throwOnError: false })
  );
  text = text.replace(/\$(.*?)\$/g, (_, x) =>
    katex.renderToString(x, { displayMode: false, throwOnError: false })
  );
  return text;
};

class Root extends React.Component {
  state = { data: '' };
  componentDidMount() {
    // postMessage works with window.addEventListener("message", ...)
    // postMessage("string", location.origin)

    // on react native, you need to use document instead
    document.addEventListener('message', message => {
      __DEV__ && console.log('DEBUG MESSAGE: ', message);
      // webpack also sends message which is not string but object
      const data = message.data;
      if (typeof data === 'string') this.setState({ data });
    }, false);
  }
  render() {
    return (
      <div>test
      <div dangerouslySetInnerHTML={{ __html: convert(this.state.data) }} />
      </div>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
