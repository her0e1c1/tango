import { exec } from 'src/store/sqlite';
import * as type from './type';
import { Omit } from 'react-redux';

// update or insert
export const updateCard = (
  card: Omit<Card, 'id'> & { id?: number }
): ThunkAction => async (dispatch, _getState) => {
  let id = card.id;
  if (!card.id) {
    if (card.deck_id && card.fkid) {
      const sql = 'select id from card where fkid = ? and deck_id = ?';
      const result = await exec(sql, [card.fkid, card.deck_id]);
      const cards = result.rows._array as Card[];
      if (cards.length) {
        id = cards[0].id;
      }
    }
  }
  if (!id) {
    dispatch(bulkInsertCards(card.deck_id, [card]));
    return;
  }
  const sql =
    'update card set name = ?, body = ?, hint = ?, mastered = ? where id = ?';
  const values = [card.name, card.body, card.hint, card.mastered, id];
  const result = await exec(sql, values);
  const c: Card = { ...card, id };
  if (result.rowsAffected === 1) {
    dispatch(type.card_bulk_insert([c]));
  } else {
    dispatch(bulkInsertCards(card.deck_id, [c]));
  }
};

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  const sql = 'update card set mastered = ? where id = ?';
  await exec(sql, [m, card.id]);
  await dispatch(type.card_bulk_insert([{ ...card, mastered: m }]));
};

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

export const bulkUpdateCards = (
  deck_id: number,
  cards: Pick<
    Card,
    'name' | 'body' | 'category' | 'hint' | 'fkid' | 'mastered'
  >[]
): ThunkAction => async (dispatch, getState) => {
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
