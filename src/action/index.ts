export * from './card';
export * from './deck';
export * from './nav';

export const getTheme = (state: RootState): Theme => {
  const theme = state.config.theme;
  if (theme === 'dark') {
    return {
      mainBackgroundColor: 'black',
      mainColor: 'silver',
      titleColor: 'silver',
      cardBackgroundColor: '#111',
      cardBorderColor: 'gray',
      circleBackgroundColor: '#222',
    };
  } else {
    // default
    return {
      mainBackgroundColor: 'skyblue',
      mainColor: 'black',
      titleColor: 'white',
      cardBorderColor: 'white',
      cardBackgroundColor: 'white',
      circleBackgroundColor: 'white',
    };
  }
};
