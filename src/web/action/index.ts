import * as firebase from 'firebase';

import * as type from 'src/action/type';
import { db } from 'src/firebase';

const checkLogin = (state: RootState): string | undefined => {
  const uid = state.config.uid;
  if (uid) {
    return uid;
  } else {
    alert('NOT LOGIN YET');
  }
};

export const configUpdate = (
  config: Partial<ConfigState>
): ThunkAction => async (dispatch, _getState) => {
  dispatch(type.configUpdate(config));
};

export const login = (): ThunkAction => async (dispatch, getState) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  __DEV__ && console.log('DEBUG: LOGIN', result.user);
  const googleAccessToken = result.credential.accessToken;
  dispatch(configUpdate({ uid: result.user.uid, googleAccessToken }));
};
