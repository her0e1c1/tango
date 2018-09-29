import * as firebase from 'firebase';

import * as type from './type';
import { db } from 'src/firebase';

const checkLogin = (state: RootState): string | undefined => {
  const uid = state.config.uid;
  if (uid) {
    return uid;
  } else {
    alert('NOT LOGIN YET');
  }
};

export const configUpdate = (
  config: Partial<ConfigState>
): ThunkAction => async (dispatch, _getState) => {
  dispatch(type.configUpdate(config));
};

export const login = (): ThunkAction => async (dispatch, getState) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  __DEV__ && console.log('DEBUG: LOGIN', result.user);
  const googleAccessToken = result.credential.accessToken;
  dispatch(configUpdate({ uid: result.user.uid, googleAccessToken }));
};

export const logout = (): ThunkAction => async (dispatch, getState) => {
  await firebase.auth().signOut();
  dispatch(configUpdate({ uid: '', googleAccessToken: '' }));
};

export const deckFetch = (): ThunkAction => async (dispatch, getState) => {
  const uid = getState().config.uid;
  if (uid) {
    const querySnapshot = await db
      .collection('deck')
      .where('uid', '==', uid)
      .get();
    const decks = [] as Deck[];
    querySnapshot.forEach(doc => {
      const d = doc.data() as Deck;
      decks.push({ ...d, id: doc.id });
    });
    await dispatch(type.deckBulkInsert(decks));
    decks.forEach(d => dispatch(cardFetch(d.id)));
  } else {
    alert('need to login');
  }
};
export const deckCreate = (
  deck: Omit<Deck, 'id' | 'createdAt'>,
  cards: Omit<Card, 'id' | 'createdAt'>[]
): ThunkAction => async (dispatch, getState) => {
  // NOTE: firestore can not store undefined value.
  // Need to convert to empty string instead
  const uid = getState().config.uid;
  if (uid) {
    const docRef = await db.collection('deck').add({
      ...deck,
      uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const batch = db.batch();
    cards.forEach(c =>
      batch.set(db.collection('card').doc(), {
        ...c,
        deckId: docRef.id,
        uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
    await batch.commit();
    await dispatch(
      type.deckBulkInsert([{ ...deck, id: docRef.id, createdAt: new Date() }])
    );
    // await dispatch(type.cardBulkInsert());
  } else {
    alert('You need to log in first');
  }
};

export const deckUpdate = (deck: Deck): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    await db
      .collection('deck')
      .doc(deck.id)
      .set({ ...deck, uid });
    dispatch(type.deckBulkInsert([deck]));
  } else {
    alert('You need to log in first');
  }
};

export const deckDelete = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    const querySnapshot = await db
      .collection('card')
      .where('deckId', '==', deckId)
      .get();
    const batch = db.batch();
    batch.delete(db.collection('deck').doc(deckId));
    querySnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await dispatch(type.deckBulkDelete([deckId]));
  } else {
    alert('You need to log in first');
  }
};

export const cardFetch = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    const querySnapshot = await db
      .collection('card')
      .where('deckId', '==', deckId)
      .get();
    const cards = [] as Card[];
    querySnapshot.forEach(doc => {
      const d = doc.data() as Card;
      cards.push({ ...d, id: doc.id });
    });
    dispatch(type.cardBulkInsert(cards));
  } else {
    alert('need to login');
  }
};

export const cardCreate = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    const docRef = await db.collection('card').add(card);
    await dispatch(type.cardBulkInsert([{ ...card, id: docRef.id }]));
  } else {
    alert('need to login');
  }
};

export const cardUpdate = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    await db
      .collection('card')
      .doc(card.id)
      .set(card);
    await dispatch(type.cardBulkInsert([card]));
  } else {
    alert('need to login');
  }
};

export const cardDelete = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  if (uid) {
    await db
      .collection('card')
      .doc(id)
      .delete();
    await dispatch(type.cardDelete(id));
  } else {
    alert('You need to log in first');
  }
};
