import * as Selector from 'src/selector';
import { updateConfig } from './config';
import { NavigationActions } from 'react-navigation';
import * as Action from 'src/action';
import * as type from './type';

export const shuffleCardsOrSort = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch(type.card_shuffle(config));
};

export const goToNextCardSetMastered = (
  mastered?: boolean
): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const card = Selector.getCurrentCard(state);
  if (card) {
    await dispatch(Action.cardUpdate({ ...card, mastered: !card.mastered }));
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

export const goToNextCard = (): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const deck = Selector.getCurrentDeck(state);
  const cards = Selector.getCurrentCardList(state);
  const currentIndex = deck.currentIndex + 1;
  if (currentIndex <= cards.length - 1) {
    await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
  } else {
    await dispatch(swipeAll());
  }
};

export const goToPrevCard = (): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const deck = Selector.getCurrentDeck(state);
  const currentIndex = deck.currentIndex - 1;
  if (currentIndex >= 0) {
    await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
  } else {
    await dispatch(goBack());
  }
};

export const goToCard = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  const state = getState();
  const cards = Selector.getCurrentCardList(getState());
  const deck = state.deck.byId[card.deckId];
  let currentIndex = 0;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].id == card.id) {
      currentIndex = i;
    }
  }
  dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
};

export const goToCardByIndex = (
  deck: Deck,
  currentIndex: number
): ThunkAction => async (dispatch, getState) => {
  dispatch(type.deck_bulk_insert([{ ...deck, currentIndex }]));
};

export const goHome = (): ThunkAction => async (dispatch, getState) => {};

export const goBack = () => async (dispatch, getState) => {
  await dispatch(NavigationActions.back());
};
export const goTo = (routeName, params?) => async (dispatch, getState) => {
  await dispatch(NavigationActions.navigate({ routeName, params }));
};

export const goToCardById = (card_id: number, deck_id: number) => async (
  dispatch,
  getState
) => {
  const a = NavigationActions.reset({
    index: 1,
    actions: [
      NavigationActions.navigate({ routeName: 'home' }),
      NavigationActions.navigate({
        routeName: 'card',
        params: { card_id, deck_id },
      }),
    ],
  });
  await dispatch(a);
};

export const swipeAll = () => async (dispatch, getState) => {
  const deck = Selector.getCurrentDeck(getState());
  await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex: 0 }]));
  await dispatch(goBack());
};

const swipeMapping = {
  goBack,
  goToPrevCard,
  goToNextCard,
  goToNextCardMastered,
  goToNextCardNotMastered,
  goToNextCardToggleMastered,
};

const cardSwipe = (direction): ThunkAction => async (dispatch, getState) => {
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
export const cardSwipeUp = () => cardSwipe('cardSwipeUp');
export const cardSwipeDown = () => cardSwipe('cardSwipeDown');
export const cardSwipeLeft = () => cardSwipe('cardSwipeLeft');
export const cardSwipeRight = () => cardSwipe('cardSwipeRight');
