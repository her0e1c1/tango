import * as RN from 'react-native';
import * as I from 'src/interface';
import { getCurrentCard } from 'src/selector';
export * from 'src/selector';
import { toggleMastered } from './card';
import { updateConfig } from './config';

export const shuffleCardsOrSort = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch({ type: 'CARD_SHUFFLE', payload: { config } });
};

export const goToNextCardSetMastered = (
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const card = getCurrentCard(state);
  if (card) {
    await dispatch(toggleMastered(card, mastered));
    if (state.config.showMastered) {
      await dispatch(goToNextCard());
    } else if (mastered === false) {
      await dispatch(goToNextCard());
    }
  }
};

export const goToNextCardToggleMastered = () => goToNextCardSetMastered();
export const goToNextCardNotMastered = () => goToNextCardSetMastered(false);
export const goToNextCardMastered = () => goToNextCardSetMastered(true);

export const goToNextCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const nav = { index: state.nav.index + 1 };
  dispatch(goTo(nav));
};

export const goToPrevCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const nav = { index: state.nav.index - 1 };
  dispatch(goTo(nav));
};

export const goHome = (): I.ThunkAction => async (dispatch, getState) => {
  dispatch({ type: 'NAV_HOME' });
};

export const goBack = () => async (dispatch, getState) => {
  const { deck, card, index }: NavState = getState().nav;
  let nav = {};
  if (index) {
    nav = { deck };
  } else if (card) {
    nav = { deck };
  }
  dispatch({ type: 'NAV_GO_BACK', payload: { nav } });
};

export const goTo = (nav: NavState): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { index } = nav;
  if (index === undefined || 0 <= index) {
    dispatch({ type: 'NAV_GO_TO', payload: { nav } });
  } else if (index < 0) {
    dispatch(goBack());
  }
};

const swipeMapping = {
  goBack,
  goToPrevCard,
  goToNextCard,
  goToNextCardMastered,
  goToNextCardNotMastered,
  goToNextCardToggleMastered,
};

const cardSwipe = (direction): I.ThunkAction => async (dispatch, getState) => {
  const config = getState().config;
  if (config.hideBodyWhenCardChanged) {
    dispatch(updateConfig({ showBody: false }));
  }
  const f = swipeMapping[config[direction]];
  if (f) {
    dispatch(f());
  } else {
    console.log(`${direction} action is not found`);
  }
};
export const cardSwipeUp = () => cardSwipe('cardSwipeUp');
export const cardSwipeDown = () => cardSwipe('cardSwipeDown');
export const cardSwipeLeft = () => cardSwipe('cardSwipeLeft');
export const cardSwipeRight = () => cardSwipe('cardSwipeRight');

export const clearAll = () => async (dispatch, getState) => {
  dispatch({ type: 'CLEAR_ALL' });
  RN.AsyncStorage.clear();
};
