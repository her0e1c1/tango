import * as I from 'src/interface';
import * as Selector from 'src/selector';
import { toggleMastered } from './card';
import { updateConfig } from './config';
import { NavigationActions } from 'react-navigation';
import * as type from './type';

export const shuffleCardsOrSort = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch(type.card_shuffle(config));
};

export const goToNextCardSetMastered = (
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const card = Selector.getCurrentCard(state);
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
  const deck = Selector.getCurrentDeck(state);
  const currentIndex = deck.currentIndex + 1;
  await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
};

export const goToPrevCard = (): I.ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const deck = Selector.getCurrentDeck(state);
  const currentIndex = deck.currentIndex - 1;
  if (currentIndex >= 0) {
    await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
  } else {
    await dispatch(goBack());
  }
};

export const goToCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  // const cards = Selector.getCurrentCardList(getState());
  // let cardIndex = 0;
  // for (let i = 0; i < cards.length; i++) {
  //   if (cards[i].id == card.id) {
  //     cardIndex = i;
  //   }
  // }
  // dispatch(updateConfig({ cardIndex }));
};

export const goHome = (): I.ThunkAction => async (dispatch, getState) => {
  // TODO: fix later
  // const { routes } = getState().nav;
  // for (let i = 0; i < routes.length - 1; i++) {
  //   dispatch(NavigationActions.back());
  // }
};

export const goBack = () => async (dispatch, getState) => {
  await dispatch(NavigationActions.back());
};
export const goTo = (routeName, params?) => async (dispatch, getState) => {
  await dispatch(NavigationActions.navigate({ routeName, params }));
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
    await dispatch(updateConfig({ showBody: false, showHint: false }));
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
