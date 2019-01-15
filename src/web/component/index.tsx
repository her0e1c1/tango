// <reference path="../../node_modules/@types/" />
import * as React from 'react';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { ConnectedRouter as Router } from 'react-router-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Route } from 'react-router-dom';
import { Layout } from 'antd';

import * as Action from 'src/web/action';
import { store, persistor, history } from '../store';
import { Header } from './header';
import { DeckList } from './deck';
import { CardList, CardView } from './card';
import { CardOrder } from './cardOrder';
import { DeckCreate, CardCreate, CardEdit } from './form';
import { PublicDeckList } from './public';
import * as queryString from 'query-string';

class _Main extends React.Component<ConnectedProps> {
  async componentDidMount() {
    // callback from google auth
    const parsed = queryString.parse(location.search);
    if (parsed.code) {
      await this.props.dispatch(Action.setGoogleTokens(parsed.code));
    } else {
      await this.props.dispatch(Action.refreshToken());
      await this.props.dispatch(Action.setEventListener());
    }
  }
  render() {
    return (
      <Layout>
        <Header />
        <Layout.Content style={{ padding: '0 5px', backgroundColor: '#fff' }}>
          <Route exact path="/" component={DeckList} />
          <Route exact path="/new" component={DeckCreate} />
          <Route exact path="/public" component={PublicDeckList} />
          <Route exact path="/deck/:deckId" component={CardList} />
          <Route exact path="/deck/:deckId/order" component={CardOrder} />
          <Route exact path="/deck/:deckId/new" component={CardCreate} />
          <Route exact path="/card/:cardId/edit" component={CardEdit} />
          <Route exact path="/card/:cardId/view/:key" component={CardView} />
        </Layout.Content>
      </Layout>
    );
  }
}
const Main = connect(state => ({ state }))(_Main);

const Root = () => (
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <Router history={history}>
        <Main />
      </Router>
    </PersistGate>
  </Provider>
);

export default Root;
