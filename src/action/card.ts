import * as I from 'src/interface';
import { exec } from 'src/store/sqlite';
import * as type from './type';

// update or insert
export const updateCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const sql =
    'update card set name = ?, body = ?, hint = ?, mastered = ? where id = ?';
  const values = [card.name, card.body, card.hint, card.id, card.mastered];
  const result = await exec(sql, values);
  if (result.rowsAffected === 1) {
    dispatch(type.card_bulk_insert([card]));
  } else {
    dispatch(bulkInsertCards(card.deck_id, [card]));
  }
};

export const deleteCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await exec('delete from card where id = ?', [card.id]);
  if (result.rowsAffected === 1) {
    dispatch(type.card_delete(card));
  } else {
    alert('You can not delete');
  }
};

export const selectCard = (deck_id?: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await exec('select * from card');
  const cards = result.rows._array;
  await dispatch(type.card_bulk_insert(cards));
};

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  const sql = 'update card set mastered = ? where id = ?';
  await exec(sql, [m, card.id]);
  await dispatch(type.card_bulk_insert([{ ...card, mastered: m }]));
};

// FIXME: how can I bulk insert?
export const bulkInsertCards = (
  deck_id: number,
  cards: Pick<
    Card,
    'name' | 'body' | 'category' | 'hint' | 'fkid' | 'mastered'
  >[]
): I.ThunkAction => async (dispatch, getState) => {
  const ps = cards.map(async card => {
    const sql =
      'insert into card (name, body, category, hint, deck_id, fkid, mastered) values (?, ?, ?, ?, ?, ?, ?);';
    const values = [
      card.name,
      card.body,
      card.category,
      card.hint,
      deck_id,
      card.fkid ? String(card.fkid) : null, // otherwise it converts 1 to "1.0",
      card.mastered,
    ];
    const result = await exec(sql, values);
    const id = result.insertId;
    id && (await dispatch(type.card_bulk_insert([{ ...card, deck_id, id }])));
  });
  await Promise.all(ps);
};

export const bulkUpdateCards = (
  deck_id: number,
  cards: Pick<
    Card,
    'name' | 'body' | 'category' | 'hint' | 'fkid' | 'mastered'
  >[]
): I.ThunkAction => async (dispatch, getState) => {
  // TODO: get from db not redux
  const state = getState().card;
  const map = (state.byDeckId[deck_id] || [])
    .map(id => state.byId[id])
    .filter(x => !!x)
    .map(c => ({ [c.fkid]: c.id }))
    .reduce((acc, x) => Object.assign(acc, x), {});
  const ps = cards.map(async card => {
    await dispatch(updateCard({ ...card, deck_id, id: map[card.fkid] }));
  });
  await Promise.all(ps);
};
