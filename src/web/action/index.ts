import * as firebase from 'firebase';
import * as Action from 'src/action';
const FileSaver = require('file-saver');

export * from 'src/action';

export const init = (): ThunkAction => async (dispatch, getState) => {
  await this.props.dispatch(Action.setEventListener());
};

export const login = (): ThunkAction => async (dispatch, getState) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  __DEV__ && console.log('DEBUG: LOGIN', result.user);
  if (result.user) {
    const { displayName, uid } = result.user;
    // @ts-ignore: credential doesn't have accessToken as key
    const googleAccessToken = result.credential.accessToken;
    dispatch(Action.configUpdate({ uid, displayName, googleAccessToken }));
  }
};

export const deckDownload = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  await dispatch(Action.cardFetch(id));
  const deck = getState().deck.byId[id];
  const csv = await dispatch(Action.deckGenerateCsv(id));
  const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
  let name = deck.name;
  if (!name.endsWith('.csv')) {
    name += '.csv';
  }
  FileSaver.saveAs(blob, name);
};
