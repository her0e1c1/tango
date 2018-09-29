import { exec } from 'src/store/sqlite';
import * as firebase from 'firebase';
import { bulkInsertCards, bulkUpdateCards } from './card';
import { startLoading, endLoading } from './config';
import * as Selector from 'src/selector';
import * as type from './type';
const Papa = require('papaparse');

export const tryInsertByURL = (url: string) => async (dispatch, getState) => {
  if (url.match(/^https?:\/\//)) {
    await dispatch(startLoading());
    try {
      await dispatch(await insertByURL(url));
    } catch {
      const errorCode: errorCode = 'CAN_NOT_FETCH';
      await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    } finally {
      await dispatch(endLoading());
    }
  } else if (url !== '') {
    const errorCode: errorCode = 'INVALID_URL';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
  }
};

export const insertByURL = (url: string): ThunkAction => async (
  dispatch,
  getState
) => {
  __DEV__ && console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(
    insertByText(text, {
      name,
      url,
    })
  );
};

export const parseTextToCsv = (text: string): ThunkAction<Card[]> => async (
  dispatch,
  getState
) => {
  const data = Papa.parse(text).data.filter(row => row.length >= 2);
  if (data.length === 0) {
    const errorCode: errorCode = 'NO_CARDS';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    throw 'No rows in text';
  }
  const cards: Card[] = data.map((d, i) => ({
    name: d[0],
    body: d[1],
    hint: d[2],
    category: d[3] ? d[3].trim() : null,
    mastered: !!d[4] && d[4].trim() ? 1 : 0,
    fkid: i + 1,
  }));
  return cards;
};

export const insertByText = (
  text: string,
  deck: DeckInsert
): ThunkAction => async (dispatch, getState) => {
  const cards = await dispatch(parseTextToCsv(text));

  // if a deck exists by fk keys, just update it
  const d = await dispatch(getByFkid(deck));
  if (!!d) {
    // overwrite
    const name = deck.name || d.name;
    await dispatch(update({ ...d, name }));
    await dispatch(bulkUpdateCards(d.id, cards));
    return;
  }

  const deck_id = await dispatch(insert(deck));
  await dispatch(bulkInsertCards(deck_id!, cards));
  __DEV__ && console.log(`FETCH DONE ${deck_id}`);
};

export const getByFkid = (
  deck: Pick<Deck, 'spreadsheetId' | 'spreadsheetGid'>
): ThunkAction<DeckSelect> => async (dispatch, getState) => {
  let sql = '',
    values = [] as any[];
  if (deck.spreadsheetId && deck.spreadsheetGid) {
    sql = 'select * from deck where spreadsheetId = ? and spreadsheetGid = ?';
    values = [deck.spreadsheetId, deck.spreadsheetGid];
  } else {
    // TODO: get by firebase id or url
    return;
  }
  const result = await exec(sql, values);
  return result.rows._array[0];
};

export const insert = (deck: DeckInsert): ThunkAction<number> => async (
  dispatch,
  getState
) => {
  const sql = `insert into deck (name, url, spreadsheetId, spreadsheetGid) values (?, ?, ?, ?)`;
  const values = [
    deck.name,
    deck.url || '',
    deck.spreadsheetId || '',
    deck.spreadsheetGid || '',
  ];
  const result = await exec(sql, values);
  const id = result.insertId;
  await dispatch(
    type.deck_bulk_insert([{ ...deck, id, isPublic: false, currentIndex: 0 }])
  );
  return id;
};

export const update = (deck: DeckUpdate): ThunkAction => async (
  dispatch,
  getState
) => {
  const sql = 'update deck set name = ?, url = ? where id = ?';
  const values = [deck.name, deck.url || '', deck.id];
  await exec(sql, values);
  await dispatch(type.deck_bulk_insert([{ ...deck, currentIndex: 0 }]));
};

export const upload = (deck: Deck): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().user.uid;
  if (uid) {
    const cards = Selector.getCardList(getState(), deck.id);
    const data = {};
    cards.forEach(c => (data[`/card/${c.id}`] = c));
    data[`/deck/${deck.id}`] = deck;
    firebase
      .database()
      .ref(`/user/${uid}`)
      .update(data)
      .catch(e => alert(e));
  } else {
    alert('You need to log in first');
  }
};

export const edit = (deck: Partial<Deck>): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(type.deck_edit(deck));
};
