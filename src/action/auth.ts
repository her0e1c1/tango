import * as Expo from 'expo';
import * as I from 'src/interface';
import * as C from 'src/constant';
import * as firebase from 'firebase';
import * as Action from 'src/action';
import { AuthSession } from 'expo';
import * as queryString from 'query-string';
import * as type from './type';

export const refreshToken = (): I.ThunkAction<boolean> => async (
  dispatch,
  getState
) => {
  const refresh_token = getState().config.googleRefreshToken;
  if (!refresh_token) {
    console.log(`You can't refresh`);
    return false;
  }
  const body = queryString.stringify({
    refresh_token,
    grant_type: 'refresh_token',
    client_id: C.GOOGLE_WEB_CLIENT_ID,
    client_secret: C.GOOGLE_WEB_CLIENT_SECRET,
  });
  const json = await fetch('https://accounts.google.com/o/oauth2/token', {
    method: 'POST',
    body,
    headers: new Headers({
      'content-type': 'application/x-www-form-urlencoded',
    }),
  }).then(r => r.json());
  await dispatch(
    Action.config.updateConfig({ googleAccessToken: json.access_token })
  );
  return true;
};

export const loginWithGoogleOnWeb = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  // need to register this url in admin console
  const redirectUrl = AuthSession.getRedirectUrl();
  const scope = C.GOOGLE_AUTH_SCOPE.join('%20');
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `&client_id=${C.GOOGLE_WEB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&scope=${scope}`;
  try {
    let result = await Expo.AuthSession.startAsync({ authUrl });
    const code = (result as any).params.code; // TODO: update @types
    const body = queryString.stringify({
      grant_type: 'authorization_code',
      redirect_uri: redirectUrl,
      client_id: C.GOOGLE_WEB_CLIENT_ID,
      client_secret: C.GOOGLE_WEB_CLIENT_SECRET,
      code,
    });
    const json = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      body,
      headers: new Headers({
        'content-type': 'application/x-www-form-urlencoded',
      }),
    }).then(r => r.json());
    const credential = firebase.auth.GoogleAuthProvider.credential(
      null, // you can skip id token
      json.access_token
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(async () => {
        await dispatch(init());
        await dispatch(
          Action.config.updateConfig({
            googleAccessToken: json.access_token,
            googleRefreshToken: json.refresh_token,
          })
        );
      })
      .catch(error => console.log(error));
  } catch (e) {
    console.log(e);
  }
};

export const loginWithGoogle = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await Expo.Google.logInAsync({
    androidClientId: C.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: C.GOOGLE_IOS_CLIENT_ID,
    // webClientId: C.GOOGLE_WEB_CLIENT_ID,
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
      .catch(error => console.log(error));
  } else {
    alert(`Can not login with Google account`);
  }
};

export const loginWithFacebook = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const result = await Expo.Facebook.logInWithReadPermissionsAsync(
      C.facebookAppId,
      { permissions: ['public_profile'] }
    );
    const { type } = result;
    const token = (result as any).token; // TODO: update @types
    if (type === 'success') {
      // Build Firebase credential with the Facebook access token.
      const credential = firebase.auth.FacebookAuthProvider.credential(token);

      // Sign in with credential from the Facebook user.
      firebase
        .auth()
        .signInWithCredential(credential)
        .then(() => dispatch(init()))
        .catch(error => console.log(error));
    }
  } catch (e) {
    alert(JSON.stringify(e));
  }
};

export const init = (): I.ThunkAction => async (dispatch, getState) => {
  firebase.auth().onAuthStateChanged(async user => {
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
  });
};

export const logout = (): I.ThunkAction => async (dispatch, getState) => {
  dispatch(type.user_logout());
};
