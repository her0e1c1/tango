import * as I from 'src/interface';
import * as Action from 'src/action';

export const getSpreadSheets = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const accessToken = getState().config.googleAccessToken;
  try {
    const json = await fetch('https://www.googleapis.com/drive/v2/files', {
      method: 'GET',
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
      }),
    }).then(r => r.json());
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
  console.log(accessToken);
  try {
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
    const text = await res.text();
    console.log(text);
    await dispatch(
      Action.deck.insertByText(text, drive.title, drive.alternateLink)
    );
  } catch (e) {
    console.log(e);
  }
};
