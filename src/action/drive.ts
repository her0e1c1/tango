import * as I from 'src/interface';
import * as Action from 'src/action';
import * as queryString from 'query-string';

const fetchAPI = (
  url: string,
  options: { method?: string; body?: any } = {}
): I.ThunkAction => async (dispatch, getState) => {
  let { method = 'GET', body } = options;
  if (body) {
    body = queryString.stringify(body);
  }
  const accessToken = getState().config.googleAccessToken;
  const res = await fetch(url, {
    method,
    body,
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`,
    }),
  });
  if (res.ok) {
    return await res.json();
  } else {
    throw res;
  }
};

export const upload = (deck: Deck): I.ThunkAction => async (
  dispatch,
  getState
) => {
  if (deck.type !== 'drive' || !deck.fkid) {
    alert('CAN NOT UPLOAD');
    return;
  }
  const range = 'A:Z';
  fetchAPI(
    `https://sheets.googleapis.com/v4/spreadsheets/${
      deck.fkid
    }/values/${range}?valueInputOption=RAW`,
    { method: 'PUT' }
  );
};

export const getSpreadSheets = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  try {
    const json = await dispatch(
      fetchAPI('https://www.googleapis.com/drive/v2/files')
    );
    await dispatch({
      type: 'DRIVE_BULK_INSERT',
      payload: { drives: json.items },
    });
  } catch (e) {
    console.log(e);
  }
};

export const importFromSpreadSheet = (
  drive: Drive,
  gid: number = 0
): I.ThunkAction => async (dispatch, getState) => {
  const accessToken = getState().config.googleAccessToken;
  try {
    await dispatch(Action.config.startLoading());
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${
        drive.id
      }/export?gid=${gid}&exportFormat=csv`,
      {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
        }),
      }
    );
    if (res.ok) {
      const text = await res.text();
      await dispatch(
        Action.deck.insertByText(text, {
          name: drive.title,
          url: drive.alternateLink,
          type: 'drive',
          fkid: drive.id,
        })
      );
    } else {
      alert('CAN NOT FETCH');
    }
  } catch (e) {
    console.log(e);
  } finally {
    await dispatch(Action.config.endLoading());
  }
};
