import * as I from 'src/interface';
import { db } from 'src/store/sqlite';

export const updateCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `update card set name = ?, body = ?, hint = ? where id = ?;`,
      [card.name, card.body, card.hint, card.id],
      (_, result) => {
        if (result.rowsAffected === 1) {
          dispatch({ type: 'BULK_INSERT', payload: { cards: [card] } });
        } else {
          alert('You can not update');
        }
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const deleteCard = (card: Card): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `delete from card where id = ?;`,
      [card.id],
      (_, result) => {
        if (result.rowsAffected === 1) {
          dispatch({ type: 'DELETE', payload: { card } });
        } else {
          alert('You can not delete');
        }
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

// can config limit
export const selectCard = (deck_id?: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  db.transaction(tx =>
    tx.executeSql(
      `select * from card`,
      [],
      (_, result) => {
        const cards = result.rows._array;
        dispatch({ type: 'BULK_INSERT', payload: { cards } });
      },
      (...args) => alert(JSON.stringify(args))
    )
  );
};

export const toggleMastered = (
  card: Card,
  mastered?: boolean
): I.ThunkAction => async (dispatch, getState) => {
  const m = mastered === undefined ? !card.mastered : mastered;
  return new Promise((resolve, reject) =>
    db.transaction(tx =>
      tx.executeSql(
        `update card set mastered = ? where id = ?`,
        [m, card.id],
        (_, result) => {
          dispatch({
            type: 'INSERT',
            payload: { card: { ...card, mastered: m } },
          });
          resolve();
        },
        (...args) => reject(alert(JSON.stringify(args)))
      )
    )
  );
};

// FIXME: how can I bulk insert?
export const bulkInsertCards = (
  deck_id: number,
  cards: Pick<Card, 'name' | 'body' | 'category'>[]
): I.ThunkAction => (dispatch, getState) =>
  new Promise((resolve, reject) =>
    db.transaction(async tx => {
      await Promise.all(
        cards.map(
          card =>
            new Promise(resolve =>
              tx.executeSql(
                `insert into card (name, body, category, deck_id) values (?, ?, ?, ?);`,
                [card.name, card.body, card.category, deck_id],
                async (_, result) => {
                  const id = result.insertId;
                  id &&
                    (await dispatch({
                      type: 'INSERT',
                      payload: { card: { ...card, deck_id, id } as Card },
                    }));
                  resolve();
                },
                (...args) => reject(alert(JSON.stringify(args)))
              )
            )
        )
      );
      resolve();
    })
  );
