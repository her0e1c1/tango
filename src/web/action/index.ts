import * as firebase from 'firebase';
import { configUpdate } from 'src/action';
export * from 'src/action';

export const login = (): ThunkAction => async (dispatch, getState) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  __DEV__ && console.log('DEBUG: LOGIN', result.user);
  if (result.user) {
    const { displayName, uid } = result.user;
    // @ts-ignore: credential doesn't have accessToken as key
    const googleAccessToken = result.credential.accessToken;
    dispatch(configUpdate({ uid, displayName, googleAccessToken }));
  }
};
