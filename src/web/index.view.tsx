import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'katex/dist/katex.css';
import { renderView } from './component/card';

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
      require(`highlight.js/styles/googlecode.css`);
    }
  }
  setEvent(event) {
    __DEV__ && console.log('DEBUG MESSAGE: ', event);
    // @ts-ignore
    const data = event.data;
    // webpack also sends message which is not string but object
    try {
      const d = JSON.parse(data);
      this.setState({ data: d.text });
    } catch {
      // DO NOTHING
    }
  }
  componentDidMount() {
    // postMessage works with window.addEventListener("message", ...)
    // postMessage("string", location.origin)
    // on react native, you need to use document instead
    window.addEventListener('message', e => this.setEvent(e), false);
    document.addEventListener('message', e => this.setEvent(e), false);
  }
  render() {
    return renderView(this.state.data || '', this.category);
  }
}

ReactDOM.render(<Root />, document.getElementById('root'));
