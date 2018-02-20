import * as Expo from 'expo';
import * as I from 'src/interface';
import * as C from 'src/constant';
import * as firebase from 'firebase';
import * as Action from 'src/action';

export const loginWithGoogle = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await Expo.Google.logInAsync({
    androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: C.GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
  const { type, idToken } = result;
  if (type === 'success') {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    firebase
      .auth()
      .signInWithCredential(credential)
      .catch(error => {
        console.log(error);
      });
  } else {
    alert(`Can not login with Google account`);
  }
};

export const loginWithFacebook = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const { type, token } = await Expo.Facebook.logInWithReadPermissionsAsync(
      C.facebookAppId,
      { permissions: ['public_profile'] }
    );

    if (type === 'success') {
      // Build Firebase credential with the Facebook access token.
      const credential = firebase.auth.FacebookAuthProvider.credential(token);

      // Sign in with credential from the Facebook user.
      firebase
        .auth()
        .signInWithCredential(credential)
        .catch(error => {
          console.log(error);
        });
    }
  } catch (e) {
    alert(JSON.stringify(e));
  }
};

export const init = (): I.ThunkAction => async (dispatch, getState) => {
  firebase.auth().onAuthStateChanged(async user => {
    if (user != null) {
      firebase
        .database()
        .ref(`/user/${user.uid}/lastOnline`)
        .onDisconnect()
        .set(firebase.database.ServerValue.TIMESTAMP);
      await dispatch({ type: 'USER_INIT', payload: user });
      await dispatch(Action.share.fetchDecks());
    } else {
      dispatch({ type: 'USER_LOGOUT' });
      console.log('NOT LOGGED IN YET');
    }
  });
};

export const logout = (): I.ThunkAction => async (dispatch, getState) => {
  dispatch({ type: 'USER_LOGOUT' });
};
