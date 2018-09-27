/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import 'katex/dist/katex.css';

import Root from './component';
import 'src/firebase';

ReactDOM.render(<Root />, document.getElementById('root'));
