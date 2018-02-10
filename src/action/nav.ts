import * as I from 'src/interface';
import { db } from 'src/store/sqlite';

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  return new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        `update card set mastered = ? where id = ?`,
        [m, card.id],
        (_, result) => {
          dispatch({
            type: 'INSERT',
            payload: { card: { ...card, mastered: m } },
          });
          resolve();
        },
        (...args) => reject(alert(JSON.stringify(args)))
      )
    )
  );
};

export const shuffleCardsOrSort = (): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const config = getState().config;
  dispatch({ type: 'CARD_SHUFFLE', payload: { config } });
};

// selector
export const getCurrentCard = (state: RootState) => {
  const cards = getCurrentCardList(state);
  if (state.nav.index) {
    return cards[state.nav.index];
  }
  return state.nav.card;
};
export const getCurrentCardList = (state: RootState): Card[] => {
  const deck = state.nav.deck;
  const config = state.config;
  if (deck) {
    const ids = state.card.byDeckId[deck.id] || [];
    const cards = ids
      .map(id => state.card.byId[id])
      .filter(c => !!c) // defensive
      .filter(c => {
        if (config.showMastered) {
          return true;
        } else {
          return !c.mastered;
        }
      });
    return cards.slice(config.start);
  } else {
    return [];
  }
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
