import { exec } from 'src/store/sqlite';
import * as type from './type';

export const bulkInsertCards = (
  deck_id: number,
  cards: Pick<
    Card,
    'name' | 'body' | 'category' | 'hint' | 'fkid' | 'mastered'
  >[]
): ThunkAction => async (dispatch, getState) => {
  const result = await exec('select count(*) from card;');
  // When you bulk insert, you can not get multi inserted ids after sql issued.
  // So you need to generate ids by yourself
  const count = result.rows._array[0]['count(*)'];
  const cards_with_id: Card[] = cards.map((c, i) => ({
    ...c,
    deck_id,
    id: count + i + 1,
  }));
  // if you change order of fields, you need to check the mapping between sql string and its values
  const sql =
    'insert into card (id, name, body, hint, category, deck_id, mastered) values ' +
    cards.map(_ => '(?, ?, ?, ?, ?, ?, ?)').join(',') +
    ';';
  const values = cards_with_id
    .map(c => [
      c.id,
      c.name || '',
      c.body || '',
      c.hint || '',
      c.category || '',
      deck_id,
      Boolean(c.mastered),
    ])
    .reduce((acc, x) => acc.concat(x));
  const result2 = await exec(sql, values);
  const missing = cards.length - result2.rowsAffected;
  if (result2.rowsAffected !== cards.length)
    alert(`${missing} CARDS ARE MISSING`);
  const ps = cards_with_id.map(
    async c => await dispatch(type.card_bulk_insert([{ ...c }]))
  );
  await Promise.all(ps);
};

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
