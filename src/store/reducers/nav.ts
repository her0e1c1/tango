import * as Redux from 'redux';
import Root from 'src/component';

const initialState = Root.router.getStateForAction(
  Root.router.getActionForPathAndParams('Main')
);

export default (
  state: NavState = initialState,
  action: Redux.Action
): NavState => {
  const nextState = Root.router.getStateForAction(action, state);
  return nextState || state;
};
