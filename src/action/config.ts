import * as RN from 'react-native';
import * as I from 'src/interface';
import { dropTables } from 'src/store/sqlite';

export const updateConfig = (config: Partial<ConfigState>) => async (
  dispatch,
  getState
) => {
  dispatch({ type: 'CONFIG', payload: { config } });
};

export const startLoading = () => async (dispatch, getState) => {
  dispatch(updateConfig({ isLoading: true }));
};

export const endLoading = () => async (dispatch, getState) => {
  dispatch(updateConfig({ isLoading: false }));
};

export const clearError = () => async (dispatch, getState) => {
  await dispatch({ type: 'CONFIG', payload: { config: { undefined } } });
};

export const getTheme = (state: RootState): Theme => {
  const theme = state.config.theme;
  if (theme === 'dark') {
    return {
      mainBackgroundColor: 'black',
      mainColor: 'silver',
      titleColor: 'silver',
      masteredColor: 'darkgreen',
      cardBackgroundColor: '#111',
      cardBorderColor: 'gray',
      circleBackgroundColor: '#222',
    };
  } else {
    // default
    return {
      mainBackgroundColor: '#1C7ED6',
      mainColor: 'black',
      titleColor: 'white',
      masteredColor: '#51CF66',
      cardBorderColor: 'white',
      cardBackgroundColor: 'white',
      circleBackgroundColor: '#DEE2E6',
    };
  }
};

export const clearAll = (clearStorage?: boolean) => async (
  dispatch,
  getState
) => {
  clearStorage && (await RN.AsyncStorage.clear());
  await dispatch({ type: 'CLEAR_ALL' });
};

export const drop = (): I.ThunkAction => async (dispatch, getState) => {
  await dropTables();
  await dispatch(clearAll(true));
};
