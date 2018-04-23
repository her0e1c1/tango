import * as type from 'src/action/type';
import { equal } from './util';

export default (
  state: ConfigState = {
    showMastered: true,
    showHeader: true,
    showBody: false,
    showHint: false,
    hideBodyWhenCardChanged: true,
    shuffled: false,
    cardInterval: 5,
    start: 0,
    theme: 'default',
    isLoading: false, // maybe not here
    errorCode: undefined,
    cardSwipeUp: 'goToNextCardToggleMastered',
    cardSwipeDown: 'goBack',
    cardSwipeLeft: 'goToPrevCard',
    cardSwipeRight: 'goToNextCardNotMastered',
    googleAccessToken: undefined,
    googleRefreshToken: undefined,
  },
  action: Action
): ConfigState => {
  if (equal(action, type.config)) {
    return { ...state, ...action.payload.config };
  } else {
    return state;
  }
};
