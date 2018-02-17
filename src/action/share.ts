import * as I from 'src/interface';
import * as firebase from 'firebase';

export const fetchDecks = (): I.ThunkAction => async (dispatch, getState) => {
  const { uid } = getState().user;
  firebase
    .database()
    .ref(`/user/${uid}/deck`)
    .on('value', snapshot => {
      const v = snapshot && snapshot.val();
      v &&
        dispatch({ type: 'SHARE_DECK_BULK_INSERT', payload: { deck: v, uid } });
    });
};

export const fetchCardsByDeckId = (deck_id: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { uid } = getState().user;
  firebase
    .database()
    .ref(`/user/${uid}/card`)
    .orderByChild('deck_id')
    .equalTo(deck_id)
    .on('value', snapshot => {
      const v = snapshot.val();
      v &&
        dispatch({ type: 'SHARE_CARD_BULK_INSERT', payload: { card: v, uid } });
    });
};

export const deleteDeck = (deck_id: number): I.ThunkAction => async (
  dispatch,
  getState
) => {
  const { uid } = getState().user;
  firebase
    .database()
    .ref(`/user/${uid}/card`)
    .orderByChild('deck_id')
    .equalTo(deck_id)
    .once('value', async snapshot => {
      const v = snapshot.val();
      if (!v) {
        console.log(`NO DECK ID (${deck_id})`);
        return;
      }
      const data = {};
      const cards = Object.values(v) as Card[];
      cards.forEach(c => (data[`/user/${uid}/card/${c.id}`] = null));
      data[`/user/${uid}/deck/${deck_id}`] = null;
      firebase
        .database()
        .ref()
        .update(data);
      dispatch({ type: 'SHARE_DECK_BULK_DELETE', payload: { deck_id, uid } });
    });
};
