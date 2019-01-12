import * as firebase from 'firebase/app';
import * as Action from 'src/action';
import * as C from 'src/constant';
const FileSaver = require('file-saver');

export * from 'src/action';

export const login = (): ThunkAction => async (dispatch, getState) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  C.GOOGLE_AUTH_SCOPES.forEach(s => provider.addScope(s));
  const result = await firebase.auth().signInWithPopup(provider);
  __DEV__ && console.log('DEBUG: LOGIN', result.user);
  if (result.user) {
    const { displayName, uid } = result.user;
    // @ts-ignore: credential doesn't have accessToken as key
    const googleAccessToken = result.credential.accessToken;

    await dispatch(
      Action.configUpdate({
        uid,
        displayName,
        googleAccessToken,
      })
    );
    await dispatch(Action.setEventListener());
  }
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
