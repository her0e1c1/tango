import * as firebase from 'firebase';
import { configUpdate, deckGenerateCsv, cardFetch } from 'src/action';
export * from 'src/action';
const FileSaver = require('file-saver');

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

export const deckDownload = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  await dispatch(cardFetch(id));
  const deck = getState().deck.byId[id];
  const csv = await dispatch(deckGenerateCsv(id));
  const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
  let name = deck.name;
  if (!name.endsWith('.csv')) {
    name += '.csv';
  }
  FileSaver.saveAs(blob, name);
};
