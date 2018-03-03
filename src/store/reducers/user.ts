import * as type from 'src/action/type';
import { equal } from './util';

export default (
  state: UserState = { uid: '', displayName: null },
  action: Action
) => {
  if (equal(action, type.user_init)) {
    const { uid, displayName } = action.payload.user;
    return { ...state, uid, displayName };
  } else if (equal(action, type.user_logout)) {
    return { ...state, uid: '', displayName: null };
  } else {
    return state;
  }
};
