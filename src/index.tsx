import * as React from 'react';
import * as RN from 'react-native';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import * as Action from 'src/action';

const reducers = { card: Action.card };

const store = Redux.createStore(
  Redux.combineReducers(reducers),
  Redux.compose(Redux.applyMiddleware(thunk))
);

class _Root extends React.Component {
  componentDidMount() {
    this.props.selectAll();
  }
  render() {
    return <RootTabs />;
  }
}
const mapStateToProps = (state: RootState) => ({});
const mapDispatchToProps = {
  selectAll: Action.select,
};
export const RootTabs2 = connect(mapStateToProps, mapDispatchToProps)(_Root);

const Root = () => (
  <Provider store={store}>
    <RootTabs2 />
  </Provider>
);
export default Root;
