import * as Redux from 'redux';

export default (
  state: ConfigState = {
    showMastered: true,
    showHeader: true,
    showBody: false,
    hideBodyWhenCardChanged: true,
    shuffled: false,
    start: 0,
    theme: 'default',
    isLoading: false, // maybe not here
    errorCode: undefined,
    cardSwipeUp: 'goToNextCardToggleMastered',
    cardSwipeDown: 'goBack',
    cardSwipeLeft: 'goToPrevCard',
    cardSwipeRight: 'goToNextCardNotMastered',
  },
  action: Redux.Action
): ConfigState => {
  if (action.type == 'CONFIG') {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};
