import * as I from 'src/interface';
import { db } from 'src/store/sqlite';

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
