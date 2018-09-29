import * as type from './type';

export const edit = (card: Partial<Card>): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(type.card_edit(card));
};

export const edit_init = (card: Partial<Card>): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(type.card_edit_init(card));
};
