import * as Action from 'src/action';

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
