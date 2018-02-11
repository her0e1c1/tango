import * as Expo from 'expo';
import * as I from 'src/interface';
import * as C from 'src/constant';
import { auth, firebase } from 'src/store/firebase';

export const loginWithFacebook = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const { type, token } = await Expo.Facebook.logInWithReadPermissionsAsync(
      C.facebookAppId,
      { permissions: ['public_profile'] }
    );
    console.log(type, token);

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
  auth.onAuthStateChanged(user => {
    if (user != null) {
      console.log(user);
      dispatch({ type: 'USER_INIT', payload: user });
    } else {
      console.log('NOT LOGGED IN YET');
    }
  });
};
