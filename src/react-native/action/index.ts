import * as Expo from 'expo';
import * as C from 'src/constant';
import * as firebase from 'firebase';
import * as Action from 'src/action';
import * as WebAction from 'src/web/action';
import * as type from 'src/action/type';
import { auth } from 'src/firebase';

export const loginWithGoogle = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await Expo.Google.logInAsync({
    androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: C.GOOGLE_IOS_CLIENT_ID,
    scopes: C.GOOGLE_AUTH_SCOPE,
  });
  const { type } = result;
  const idToken = (result as any).idToken; // TODO: update @types
  if (type === 'success') {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(() => dispatch(init()))
      .catch(error => __DEV__ && console.log(error));
  } else {
    alert(`Can not login with Google account`);
  }
};

export const init = (): ThunkAction => async (dispatch, getState) => {
  auth.onAuthStateChanged(async user => {
    __DEV__ && console.log('DEBUG: INIT', user);
    await dispatch(WebAction.configUpdate({ uid: user.uid }));
    await dispatch(WebAction.deckFetch());
    /*
    await dispatch(Action.config.endLoading());
    if (user != null) {
      firebase
        .database()
        .ref(`/user/${user.uid}/lastOnline`)
        .onDisconnect()
        .set(firebase.database.ServerValue.TIMESTAMP);
      await dispatch(type.user_init(user));
      // await dispatch(Action.share.fetchDecks());
      const ok = await dispatch(Action.drive.refreshToken());
      ok && (await dispatch(Action.drive.getSpreadSheets()));
    } else {
      dispatch(type.user_logout());
      console.log('NOT LOGGED IN YET');
    }
    */
  });
};
