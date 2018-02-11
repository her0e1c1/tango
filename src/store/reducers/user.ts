import * as Redux from 'redux';

export default (
  state: UserState = { uid: '', displayName: null },
  action: Redux.Action
) => {
  if (action.type == 'USER_INIT') {
    const { uid, displayName } = action.payload;
    return { ...state, uid, displayName };
  } else {
    return state;
  }
};
