import * as I from 'src/interface';
import { db } from 'src/store/sqlite';
import * as firebase from 'firebase';
import { bulkInsertCards } from './card';
import { startLoading, endLoading } from './config';
import * as Selector from 'src/selector';
import * as Action from 'src/action';
const Papa = require('papaparse');

export const tryInsertByURL = (text: string) => async (dispatch, getState) => {
  if (text.match(/^https?:\/\//)) {
    await dispatch(startLoading());
    try {
      await dispatch(await insertByURL(text));
    } catch {
      const errorCode: errorCode = 'CAN_NOT_FETCH';
      await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    } finally {
      await dispatch(endLoading());
    }
  } else if (text !== '') {
    const errorCode: errorCode = 'INVALID_URL';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
  }
};

export const insertByURL = (url: string): I.ThunkAction => async (
  dispatch,
  getState
) => {
  console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(insertByText(text, name, url));
};

export const insertByText = (
  text: string,
  name: string,
  url?: string
): I.ThunkAction => async (dispatch, getState) => {
  const data = Papa.parse(text).data.filter(row => row.length >= 2);
  console.log('PARSED');
  if (data.length === 0) {
    const errorCode: errorCode = 'NO_CARDS';
    await dispatch({ type: 'CONFIG', payload: { config: { errorCode } } });
    return;
  }
  const cards: Card[] = data.map(d => ({
    name: d[0],
    body: d[1],
    category: d[2],
  }));
  const deck_id = await dispatch(insert({ url, name }));
  await dispatch(bulkInsertCards(deck_id!, cards));
  console.log(`FETCH DONE ${deck_id}`);
};

export const remove = (deck: Deck): I.ThunkAction => async (
  dispatch,
  getState
) => {
  console.log(`REMOVE ${deck.id}`);
  db.transaction(
    tx => {
      tx.executeSql(
        `
        delete from deck where id = ?;
        delete from card where deck_id = ?;
        `,
        [deck.id, deck.id],
        (_, result) => {
          dispatch({ type: 'DECK_DELETE', payload: { deck } });
          dispatch({ type: 'CARD_BULK_DELETE', payload: { deck } });
        },
        (...args) => alert(JSON.stringify(args))
      );
    },
    (...args) => console.log(JSON.stringify(args)),
    (...args) => console.log(JSON.stringify(args))
  );
};

export const select = (limit: number = 50): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `select * from deck;`,
      [],
      (_, result) => {
        const decks = result.rows._array;
        dispatch({ type: 'DECK_BULK_INSERT', payload: { decks } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const insert = (deck: Pick<Deck, 'name' | 'url'>): I.ThunkAction => (
  dispatch,
  getState
) =>
  new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        `insert into deck (name, url) values (?, ?)`,
        [deck.name, deck.url],
        async (_, result) => {
          const id = result.insertId;
          await dispatch({
            type: 'DECK_INSERT',
            payload: { deck: { ...deck, id } },
          });
          resolve(id);
        },
        (...args) => reject(alert(JSON.stringify(args)))
      )
    )
  );

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
