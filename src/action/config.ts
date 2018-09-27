import * as RN from 'react-native';
import { dropTables } from 'src/store/sqlite';
import * as type from './type';

export const updateConfig = (config: Partial<ConfigState>) => async (
  dispatch,
  getState
) => {
  dispatch(type.config(config));
};

export const toggle = (key: keyof ConfigState): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(updateConfig({ [key]: !getState().config[key] }));
};

export const startLoading = () => async (dispatch, getState) => {
  dispatch(updateConfig({ isLoading: true }));
};

export const endLoading = () => async (dispatch, getState) => {
  dispatch(updateConfig({ isLoading: false }));
};

export const clearError = () => async (dispatch, getState) => {
  await dispatch(type.config({ errorCode: undefined }));
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
      bgTextInput: 'gray',
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
      bgTextInput: 'white',
    };
  }
};

export const clearAll = (clearStorage?: boolean): ThunkAction => async (
  dispatch,
  getState
) => {
  clearStorage && (await RN.AsyncStorage.clear());
  await dispatch(type.clear_all());
};

export const drop = (): ThunkAction => async (dispatch, getState) => {
  await dropTables();
  await dispatch(clearAll(true));
};
