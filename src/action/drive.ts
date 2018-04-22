import * as I from 'src/interface';
import * as Selector from 'src/selector';
import * as type from './type';
import * as Action from 'src/action';

const fetchAPI = (
  url: string,
  options: { method?: string; body?: any; isJson?: boolean } = {}
): I.ThunkAction<Response> => async (dispatch, getState) => {
  let { method = 'GET', body, isJson = false } = options;
  if (body) {
    body = JSON.stringify(body);
  }
  const accessToken = getState().config.googleAccessToken;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    body,
    headers: new Headers(headers),
  });
  if (res.ok) {
    return res;
  }
  throw res;
};

export const upload = (deck: Deck): I.ThunkAction => async (
  dispatch,
  getState
) => {
  if (deck.type !== 'drive' || !deck.fkid) {
    alert('CAN NOT UPLOAD');
    return;
  }
  const cards = Selector.getCardList(getState(), deck.id);
  cards.sort((a, b) => a.id - b.id);
  const values = cards.map(c => [
    c.name || '',
    c.body || '',
    c.hint || '',
    c.category || '',
    c.mastered ? '1' : '',
  ]);
  const range = encodeURIComponent('A:Z');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${
    deck.fkid
  }/values/${range}?valueInputOption=RAW`;
  try {
    await dispatch(
      fetchAPI(url, { method: 'PUT', body: { values }, isJson: true })
    );
  } catch (e) {
    alert(JSON.stringify(e));
  }
};

export const getSpreadSheets = (retry: boolean = true): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const url =
      'https://www.googleapis.com/drive/v3/files?corpora=user&q=trashed%3Dfalse';
    const res = await dispatch(fetchAPI(url));
    const json = await res.json();
    await dispatch(type.drive_bulk_insert(json.files));
  } catch (e) {
    if (retry) {
      const ok = await dispatch(Action.auth.refreshToken());
      if (ok) {
        await dispatch(getSpreadSheets(false));
        return;
      }
    }
    await dispatch(Action.auth.logout());
    console.log(e);
  }
};

export const getSheets = (drive: Drive): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${drive.id}`;
    const res = await dispatch(fetchAPI(url));
    const json: { sheets: Sheet[] } = await res.json();
    await dispatch(type.drive_bulk_insert([{ ...drive, sheets: json.sheets }]));
  } catch (e) {
    alert(JSON.stringify(e));
  }
};

export const importFromSpreadSheet = (
  drive: Drive,
  gid: number
): I.ThunkAction => async (dispatch, getState) => {
  try {
    await dispatch(Action.config.startLoading());
    const res = await dispatch(
      fetchAPI(
        `https://docs.google.com/spreadsheets/d/${
          drive.id
        }/export?gid=${gid}&exportFormat=csv`
      )
    );
    const text = await res.text();
    await dispatch(
      Action.deck.insertByText(text, {
        name: drive.name,
        type: 'drive',
        fkid: drive.id,
      })
    );
  } catch (e) {
    console.log(e);
  } finally {
    await dispatch(Action.config.endLoading());
  }
};
