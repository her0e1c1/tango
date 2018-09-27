import * as React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter as Router } from 'react-router-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Route } from 'react-router-dom';
import { Layout } from 'antd';

import { store, persistor, history } from 'src/store';
import { Header } from './header';
import { DeckList } from './deck';
import { CardList } from './card';
import { DeckCreate } from './new';

const Root = () => (
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <Router history={history}>
        <Layout>
          <Header />
          <Layout.Content style={{ padding: '0 5px', backgroundColor: '#fff' }}>
            <Route exact path="/" component={DeckList} />
            <Route exact path="/new" component={DeckCreate} />
            <Route exact path="/deck/:id" component={CardList} />
          </Layout.Content>
        </Layout>
      </Router>
    </PersistGate>
  </Provider>
);

export default Root;
