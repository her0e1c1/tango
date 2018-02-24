import * as Redux from 'redux';

export default (state: DriveState = { byId: {} }, action: Redux.Action) => {
  if (action.type == 'DRIVE_BULK_INSERT') {
    const drives: Drive[] = action.payload.drives;
    drives
      .filter(d => d.mimeType === 'application/vnd.google-apps.spreadsheet')
      .filter(d => !d.labels.trashed)
      .forEach(d => (state.byId[d.id] = d));
    return { ...state };
  } else {
    return state;
  }
};
