import * as Redux from 'redux';

export default (state: NavState = {}, action: Redux.Action): NavState => {
  if (action.type == 'NAV_GO_TO') {
    return { ...state, ...action.payload.nav };
  } else if (action.type == 'NAV_GO_BACK') {
    return action.payload.nav;
  } else if (action.type == 'NAV_HOME') {
    return { deck: undefined, card: undefined, index: undefined };
  } else {
    return state;
  }
};
