import * as I from 'src/interface';
import { exec } from 'src/store/sqlite';
import * as firebase from 'firebase';
import { bulkInsertCards, bulkUpdateCards } from './card';
import { startLoading, endLoading } from './config';
import * as Selector from 'src/selector';
import * as Action from 'src/action';
import * as Papa from 'papaparse';

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
  console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(insertByText(text, { name, url, type: 'url' }));
};

export const parseTextToCsv = (text: string): I.ThunkAction<Card[]> => async (
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
    category: d[3],
    mastered: !!d[4] ? 1 : 0,
    fkid: i + 1,
  }));
  return cards;
};

export const insertByText = (
  text: string,
  deck: Pick<Deck, 'name' | 'url' | 'type' | 'fkid'>
): I.ThunkAction => async (dispatch, getState) => {
  const cards = await dispatch(parseTextToCsv(text));
  if (deck.fkid) {
    const d = await dispatch(Action.deck.getByFkid(deck.fkid));
    if (!!d) {
      await dispatch(update({ ...deck, id: d.id }));
      await dispatch(bulkUpdateCards(d.id, cards));
      return;
    }
  }
  const deck_id = await dispatch(insert(deck));
  await dispatch(bulkInsertCards(deck_id!, cards));
  console.log(`FETCH DONE ${deck_id}`);
};

export const remove = (deck: Deck): I.ThunkAction => async (
  dispatch,
  getState
) => {
  // TODO: use transaction
  await exec('delete from deck where id = ?', [deck.id]);
  await exec('delete from card where deck_id = ?', [deck.id]);
  dispatch({ type: 'DECK_DELETE', payload: { deck } });
  dispatch({ type: 'CARD_BULK_DELETE', payload: { deck } });
};

export const select = (limit: number = 50): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const result = await exec(`select * from deck;`);
  const decks = result.rows._array;
  await dispatch({ type: 'DECK_BULK_INSERT', payload: { decks } });
};

export const getByFkid = (fkid: string): ThunkAction<Deck> => async (
  dispatch,
  getState
) => {
  const result = await exec(`select * from deck where fkid = ?;`, [fkid]);
  return result.rows._array[0];
};

export const insert = (
  deck: Pick<Deck, 'name' | 'url' | 'type' | 'fkid'>
): I.ThunkAction<number> => async (dispatch, getState) => {
  const sql = `insert into deck (name, url, type, fkid) values (?, ?, ?, ?)`;
  const values = [deck.name, deck.url, deck.type, deck.fkid || null];
  const result = await exec(sql, values);
  const id = result.insertId;
  await dispatch({
    type: 'DECK_INSERT',
    payload: { deck: { ...deck, id } },
  });
  return id;
};

export const update = (
  deck: Pick<Deck, 'name' | 'url' | 'type' | 'fkid' | 'id'>
): I.ThunkAction => async (dispatch, getState) => {
  const sql =
    'update deck set name = ?, url = ?, type =?, fkid =?; where id = ?';
  const values = [deck.name, deck.url, deck.type, deck.fkid || null, deck.id];
  await exec(sql, values);
  await dispatch({
    type: 'DECK_INSERT',
    payload: { deck: { ...deck } },
  });
};

export const upload = (deck: Deck): I.ThunkAction => async (
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

// create a new deck every time for now
export const importFromFireBase = (deck_id: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { uid } = getState().user;
  if (uid) {
    await dispatch(startLoading());
    firebase
      .database()
      .ref(`/user/${uid}/deck/${deck_id}`)
      .once('value', async snapshot => {
        const v = snapshot.val();
        const id = await dispatch(insert(v as Deck));
        firebase
          .database()
          .ref(`/user/${uid}/card`)
          .orderByChild('deck_id')
          .equalTo(deck_id)
          .once('value', async snapshot => {
            const v = snapshot.val();
            const cards = Object.values(v) as Card[];
            await dispatch(Action.bulkInsertCards(id, cards));
            await dispatch(endLoading());
          })
          .catch(e => {
            dispatch(endLoading());
            console.log(e);
          });
      });
  } else {
    alert('NOT LOGGED IN YET');
  }
};
