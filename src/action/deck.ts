import { exec } from 'src/store/sqlite';
import * as type from './type';

export const update = (deck: DeckUpdate): ThunkAction => async (
  dispatch,
  getState
) => {
  const sql = 'update deck set name = ?, url = ? where id = ?';
  const values = [deck.name, deck.url || '', deck.id];
  await exec(sql, values);
  await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex: 0 }]));
};

export const edit = (deck: Partial<Deck>): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(type.deck_edit(deck));
};
