import * as type from './type';

export const edit = (deck: Partial<Deck>): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(type.deck_edit(deck));
};
