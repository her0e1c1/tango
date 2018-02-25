import * as I from 'src/interface';
import { exec } from 'src/store/sqlite';

export const updateCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  // TODO: mastered
  const sql =
    'update card set name = ?, body = ?, hint = ?, mastered = ? where id = ?';
  await exec(sql, [card.name, card.body, card.hint, card.id, card.mastered]);
  dispatch({ type: 'BULK_INSERT', payload: { cards: [card] } });
};

export const deleteCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await exec('delete from card where id = ?', [card.id]);
  if (result.rowsAffected === 1) {
    dispatch({ type: 'DELETE', payload: { card } });
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
  dispatch({ type: 'BULK_INSERT', payload: { cards } });
};

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  const sql = 'update card set mastered = ? where id = ?';
  await exec(sql, [m, card.id]);
  dispatch({ type: 'INSERT', payload: { card: { ...card, mastered: m } } });
};

// FIXME: how can I bulk insert?
export const bulkInsertCards = (
  deck_id: number,
  cards: Pick<Card, 'name' | 'body' | 'category' | 'hint' | 'fkid'>[]
): I.ThunkAction => async (dispatch, getState) => {
  const ps = cards.map(async card => {
    const sql =
      'insert into card (name, body, category, hint, deck_id, fkid) values (?, ?, ?, ?, ?, ?);';
    const values = [
      card.name,
      card.body,
      card.category,
      card.hint,
      deck_id,
      card.fkid ? String(card.fkid) : null, // otherwise it converts 1 to "1.0"
    ];
    const result = await exec(sql, values);
    const id = result.insertId;
    id &&
      (await dispatch({
        type: 'INSERT',
        payload: { card: { ...card, deck_id, id } as Card },
      }));
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
