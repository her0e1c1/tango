import * as Redux from 'redux';
import { Root } from 'src/component/main';

const initialState = Root.router.getStateForAction(
  Root.router.getActionForPathAndParams('home')
);

export default (
  state: NavState = initialState,
  action: Redux.Action
): NavState => {
  const nextState = Root.router.getStateForAction(action, state);
  return nextState || state;
};
