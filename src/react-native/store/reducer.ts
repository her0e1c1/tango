import * as Redux from 'redux';
import { NavigationActions } from 'react-navigation';
import Root from 'src/react-native/component';

import * as type from 'src/action/type';
import { deck, card, config, sheet, equal } from 'src/store/reducer';

const initialState = Root.router.getStateForAction(
  NavigationActions.init()
  // WARN: some sample code recommends code like this
  // Root.router.getActionForPathAndParams('Main')
  // But in this case, it push a duplicated object to routes
  // it may happen if you use nested routers
);
export const nav = (
  state: NavState = initialState,
  action: Redux.Action
): NavState => {
  const nextState = Root.router.getStateForAction(action, state);
  return nextState || state;
};

const reducers = {
  nav,
  deck,
  card,
  sheet,
  config,
};

export const root = (state, action) => {
  if (equal(action, type.clearAll)) {
    state = undefined;
  }
  return Redux.combineReducers(reducers)(state, action);
};
