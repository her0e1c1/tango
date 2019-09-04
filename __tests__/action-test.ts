import * as type from 'src/action/type';
import * as action from 'src/action';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

import fetchMock from 'fetch-mock';
import * as C from 'src/constant';

// @ts-ignore
global.Headers = () => ({});

describe('Test Action', () => {
  beforeEach(() => {
    fetchMock.restore();
  });
  it('refresh token', async () => {
    const store = mockStore({
      config: { googleRefreshToken: 'REFRESH', googleAccessToken: 'OLD TOKEN' },
    });
    fetchMock.post(C.URL_GOOGLE_TOKEN, { access_token: 'NEW TOKEN' });
    await store.dispatch(action.refreshToken());
    expect(store.getActions()[0]).toEqual(
      type.configUpdate({ googleAccessToken: 'NEW TOKEN' })
    );
  });

  /*
  it('failed to refresh token', async () => {
    const store = mockStore({
      config: { googleRefreshToken: 'REFRESH', googleAccessToken: 'OLD TOKEN' },
    });
    fetchMock.post(C.URL_GOOGLE_TOKEN, 403);
    await store.dispatch(action.refreshToken());
    expect(store.getActions()[0]).toEqual(
      type.error('FAILED_TO_REFRESH_TOKEN')
    );
  });
  */

  it('fetch spread sheet by id', async () => {
    const store = mockStore({ config: {} });
    fetchMock.get('*', {
      sheets: [{ properties: { title: 'TITLE', sheetId: 'SHEETID' } }],
    });
    await store.dispatch(action.spreadSheetFetch('sid', 'name'));
    expect(store.getActions()[0]).toEqual(
      type.sheetBulkInsert([
        {
          id: 'sid::TITLE',
          index: 'SHEETID',
          name: 'name',
          title: 'TITLE',
          spreadSheetId: 'sid',
        } as Sheet,
      ])
    );
  });
});
