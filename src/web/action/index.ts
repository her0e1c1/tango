import * as firebase from 'firebase/app';
import * as Action from 'src/action';
import * as C from 'src/constant';
import { auth } from 'src/firebase';
export * from 'src/action';
import * as queryString from 'query-string';
import { configUpdate } from 'src/action/type';
const FileSaver = require('file-saver');

export const init = (): ThunkAction => async (dispatch, getState) => {
  auth.onAuthStateChanged(async user => {
    __DEV__ && console.log('DEBUG: INIT', user);
    if (user) {
      await dispatch(
        Action.configUpdate({
          uid: user.uid,
          displayName: user.displayName,
        })
      );
      await dispatch(Action.setEventListener());
    } else {
      console.log('NOT LOGGED IN YET');
    }
  });
};

// you can get code after auth login
export const setGoogleTokens = (code: string): ThunkAction => async (
  dispatch,
  _getState
) => {
  const body = queryString.stringify({
    grant_type: 'authorization_code',
    redirect_uri: __REDIRECT_URI__,
    client_id: C.GOOGLE_WEB_CLIENT_ID,
    client_secret: C.GOOGLE_WEB_CLIENT_SECRET,
    code: code,
  });
  const res = await fetch('https://accounts.google.com/o/oauth2/token', {
    method: 'POST',
    body,
    headers: new Headers({
      'content-type': 'application/x-www-form-urlencoded',
    }),
  });
  const json = (await res.json()) as {
    access_token: string;
    id_token: string;
    refresh_token: string;
  };
  if (json.access_token && json.refresh_token && json.id_token) {
    const credential = firebase.auth.GoogleAuthProvider.credential(
      json.id_token
    );
    await firebase.auth().signInAndRetrieveDataWithCredential(credential);
    await dispatch(init());
    await dispatch(
      configUpdate({
        googleAccessToken: json.access_token,
        googleRefreshToken: json.refresh_token,
      })
    );
  }
};

export const login = (): ThunkAction => async (_dispatch, _getState) => {
  // If you call this api, you need to ask google to verify your app.
  // Otherwise it will show this app is not verified when user logs in
  const redirectUrl = __REDIRECT_URI__;
  const scope = C.GOOGLE_AUTH_SCOPES.join('%20');
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `&client_id=${C.GOOGLE_WEB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&scope=${scope}`;
  location.href = authUrl;
};

export const deckDownload = (
  id: string,
  opt?: { public: boolean }
): ThunkAction => async (dispatch, getState) => {
  const fetch = opt && opt.public;
  if (fetch) {
    await dispatch(Action.deckImportPublic(id));
  }
  const deck = getState().deck.byId[id];
  const csv = await dispatch(Action.deckGenerateCsv(id));
  const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
  let name = deck.name;
  if (!name.endsWith('.csv')) {
    name += '.csv';
  }
  FileSaver.saveAs(blob, name);
};
