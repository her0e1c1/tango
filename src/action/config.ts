import * as RN from 'react-native';
import * as I from 'src/interface';

export const updateConfig = (config: Partial<ConfigState>) => async (
  dispatch,
  getState
) => {
  dispatch({ type: 'CONFIG', payload: { config } });
};

export const startLoading = () => async (dispatch, getState) => {
  dispatch({ type: 'CONFIG', payload: { config: { isLoading: true } } });
};

export const endLoading = () => async (dispatch, getState) => {
  dispatch({ type: 'CONFIG', payload: { config: { isLoading: false } } });
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

export const clearAll = () => async (dispatch, getState) => {
  dispatch({ type: 'CLEAR_ALL' });
  RN.AsyncStorage.clear();
};

export const checkVersion = (current): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { version } = getState().config;
  if (current !== version) {
    await dispatch(clearAll());
    await dispatch(updateConfig({ version: current }));
  }
};
