import * as I from 'src/interface';
import { getCurrentCard } from 'src/selector';
export * from 'src/selector';
import { toggleMastered } from './card';
import { updateConfig } from './config';
import { NavigationActions } from 'react-navigation';

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
  const cardIndex = state.config.cardIndex + 1;
  await dispatch(updateConfig({ cardIndex }));
};

export const goToPrevCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const cardIndex = state.config.cardIndex - 1;
  if (cardIndex >= 0) {
    await dispatch(updateConfig({ cardIndex }));
  } else {
    await dispatch(goBack());
  }
};

export const goHome = (): I.ThunkAction => async (dispatch, getState) => {
  const { routes } = getState().nav;
  for (let i = 0; i < routes.length - 1; i++) {
    dispatch(NavigationActions.back());
  }
};

export const goBack = () => async (dispatch, getState) => {
  await dispatch(NavigationActions.back());
};

const swipeMapping = {
  goBack,
  goToPrevCard,
  goToNextCard,
  goToNextCardMastered,
  goToNextCardNotMastered,
  goToNextCardToggleMastered,
};

const cardSwipe = (direction, index: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  if (config.hideBodyWhenCardChanged) {
    await dispatch(updateConfig({ showBody: false }));
  }
  const f = swipeMapping[config[direction]];
  if (f) {
    await dispatch(f());
  } else {
    console.log(`${direction} action is not found`);
  }
};
export const cardSwipeUp = (i: number) => cardSwipe('cardSwipeUp', i);
export const cardSwipeDown = (i: number) => cardSwipe('cardSwipeDown', i);
export const cardSwipeLeft = (i: number) => cardSwipe('cardSwipeLeft', i);
export const cardSwipeRight = (i: number) => cardSwipe('cardSwipeRight', i);
