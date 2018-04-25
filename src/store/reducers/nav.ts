import * as Redux from 'redux';
import { NavigationActions } from 'react-navigation';
import Root from 'src/component';

const initialState = Root.router.getStateForAction(
  NavigationActions.init()
  // WARN: some sample code recommends code like this
  // Root.router.getActionForPathAndParams('Main')
  // But in this case, it push a duplicated object to routes
  // it may happen if you use nested routers
);
export default (
  state: NavState = initialState,
  action: Redux.Action
): NavState => {
  const nextState = Root.router.getStateForAction(action, state);
  return nextState || state;
};
