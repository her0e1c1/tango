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
      console.log('FETCH OK');
      const text = await res.text();
      await dispatch(
        Action.deck.insertByText(text, drive.title, drive.alternateLink)
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
