import * as React from 'react';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { ConnectedRouter as Router } from 'react-router-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Route } from 'react-router-dom';
import { Layout } from 'antd';

import * as Action from 'src/action';
import { store, persistor, history } from '../store';
import { Header } from './header';
import { DeckList } from './deck';
import { CardList } from './card';
import { CardOrder } from './cardOrder';
import { DeckCreate, CardCreate, CardEdit } from './form';

class _Main extends React.Component<ConnectedProps> {
  async componentDidMount() {
    await this.props.dispatch(Action.setEventListener());
  }
  render() {
    return (
      <Layout>
        <Header />
        <Layout.Content style={{ padding: '0 5px', backgroundColor: '#fff' }}>
          <Route exact path="/" component={DeckList} />
          <Route exact path="/new" component={DeckCreate} />
          <Route exact path="/deck/:deckId" component={CardList} />
          <Route exact path="/deck/:deckId/order" component={CardOrder} />
          <Route exact path="/deck/:deckId/new" component={CardCreate} />
          <Route exact path="/card/:cardId/edit" component={CardEdit} />
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
