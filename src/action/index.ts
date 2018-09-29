import * as nav from './nav';
import * as auth from './auth';
import * as config from './config';

export * from 'src/react-native/action';
export * from 'src/web/action';
export { auth, nav, config };

import * as firebase from 'firebase';
import * as Papa from 'papaparse';
import * as type from './type';
import * as WebAction from 'src/web/action';

export const logout = (): ThunkAction => async (dispatch, getState) => {
  await firebase.auth().signOut();
  dispatch(type.configUpdate({ uid: '', googleAccessToken: '' }));
};

export const refreshToken = (): ThunkAction<boolean> => async (
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

export const insertByURL = (url: string): ThunkAction => async (
  dispatch,
  getState
) => {
  __DEV__ && console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(
    insertByText(text, {
      name,
      url,
    })
  );
};

export const insertByText = (text, deck): ThunkAction => (
  dispatch,
  _getState
) => {
  // info.file.originFileObj
  const results = Papa.parse(text);
  __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
  const cards: Card[] = results.data
    .map(d => ({
      frontText: d[0] || '',
      backText: d[1] || '',
      hint: d[2] || '',
      tags: [],
    }))
    .filter(c => !!c.frontText);
  const d = { name: deck.name, isPublic: false };
  dispatch(WebAction.deckCreate(d, cards));
  /*
  Papa.parse(text, {
    complete: async results => {
      __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
      const cards: Card[] = results.data
        .map(d => ({
          frontText: d[0] || '',
          backText: d[1] || '',
          hint: d[2] || '',
          tags: [],
        }))
        .filter(c => !!c.frontText);
      const d = { name: deck.name, isPublic: false };
      dispatch(WebAction.deckCreate(d, cards));
    },
  });
  */
};

/*
export const importFromSpreadSheet = (
  drive: Drive,
  sheet: Sheet
): ThunkAction => async (dispatch, getState) => {
  const gid = sheet.properties.sheetId;
  try {
    await dispatch(Action.config.startLoading());
    const res = await dispatch(
      fetchAPI(
        `https://docs.google.com/spreadsheets/d/${
          drive.id
        }/export?gid=${gid}&exportFormat=csv`
      )
    );
    if (res.ok) {
      const text = await res.text();
      await dispatch(
        Action.deck.insertByText(text, {
          name: sheet.properties.title,
          spreadsheetId: drive.id,
          spreadsheetGid: String(gid),
        })
      );
    } else {
      alert('CAN NOT IMPORT');
    }
  } catch (e) {
    console.log(e);
  } finally {
    await dispatch(Action.config.endLoading());
  }
};
*/
