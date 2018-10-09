import { pull } from 'lodash';
import * as firebase from 'firebase';
import * as Papa from 'papaparse';

import * as type from './type';
import { db } from 'src/firebase';
import * as Selector from 'src/selector';

export * from './type';

export const rowToCard = (row: string[]): Partial<Card> => ({
  frontText: row[0] || '',
  backText: row[1] || '',
  hint: row[2] || '',
  tags: row[3] ? row[3].split(',') : [],
});

export const cardToRow = (card: Card): string[] => [
  card.frontText,
  card.backText,
  card.hint,
  card.tags.join(','),
];

export const logout = (): ThunkAction => async (dispatch, getState) => {
  await firebase.auth().signOut();
  dispatch(type.configUpdate({ uid: '', googleAccessToken: '' }));
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

export const insertByText = (text, deck): ThunkAction => (
  dispatch,
  _getState
) => {
  const results = Papa.parse(text);
  __DEV__ && console.log('DEBUG: CSV COMPLETE', results);
  const cards: Card[] = results.data
    .map(d => ({
      frontText: d[0] || '',
      backText: d[1] || '',
      hint: d[2] || '',
      tags: d[3] ? d[3].split(',') : [],
    }))
    .filter(c => !!c.frontText);
  const d = { name: deck.name, isPublic: false };
  dispatch(deckCreate(d, cards));
};

export const setEventListener = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const state = getState();
  const uid = state.config.uid;
  if (!uid) {
    return; // DO NOTHING
  }
  if (Object.keys(state.deck.byId).length === 0) {
    const decks = await dispatch(deckFetch());
    decks.forEach(async d => await dispatch(cardFetch(d.id)));
  }
  // FIEME: maybe client timestamp is different from server's one
  const updatedAt = getState().config.lastUpdatedAt;
  __DEV__ &&
    console.log(
      'LAST UPDATED AT: ',
      updatedAt,
      ' => ',
      new Date().getTime(),
      '=>',
      new Date(updatedAt)
    );
  db.collection('deck')
    .where('uid', '==', uid)
    .where('updatedAt', '>=', new Date(updatedAt))
    .orderBy('updatedAt', 'desc')
    .onSnapshot(async snapshot => {
      // it seems docChanges().forEach is not async func
      const decks = [] as Deck[];
      snapshot.docChanges().forEach(change => {
        const id = change.doc.id;
        const deck = { ...change.doc.data(), id } as Deck;
        if (change.type === 'added') {
          decks.push(deck);
        } else if (change.type === 'modified') {
          decks.push(deck);
        } else if (change.type === 'removed') {
          dispatch(type.deckDelete(id));
        }
      });
      if (decks.length > 0) {
        await dispatch(type.deckBulkInsert(decks));
      }
      await dispatch(configUpdate({ lastUpdatedAt: new Date().getTime() }));
    });
  db.collection('card')
    .where('uid', '==', uid)
    .where('updatedAt', '>=', new Date(updatedAt))
    .orderBy('updatedAt', 'desc')
    .onSnapshot(async snapshot => {
      const cards = [] as Card[];
      snapshot.docChanges().forEach(change => {
        const id = change.doc.id;
        const card = { ...change.doc.data(), id } as Card;
        if (change.type === 'added') {
          cards.push(card);
        } else if (change.type === 'modified') {
          cards.push(card);
        } else if (change.type === 'removed') {
          dispatch(type.cardDelete(id));
        }
      });
      if (cards.length > 0) {
        await dispatch(type.cardBulkInsert(cards));
      }
      dispatch(configUpdate({ lastUpdatedAt: new Date().getTime() }));
    });
};

export const deckFetch = (
  isPublic: boolean = false
): ThunkAction<Promise<Deck[]>> => async (dispatch, getState) => {
  const uid = getState().config.uid;
  if (!isPublic && !uid) {
    alert('need to login');
    return [];
  }
  const query = db.collection('deck');
  // const query = db.collection('deck').orderBy('updatedAt', 'desc');
  let querySnapshot: firebase.firestore.QuerySnapshot;
  if (isPublic) {
    querySnapshot = await query.where('isPublic', '==', true).get();
  } else {
    querySnapshot = await query.where('uid', '==', uid).get();
  }
  const decks = [] as Deck[];
  querySnapshot.forEach(doc => {
    const d = doc.data() as Deck;
    decks.push({ ...d, id: doc.id });
  });
  await dispatch(type.deckBulkInsert(decks));
  return decks;
};

export const deckCreate = (
  deck: Pick<Deck, 'name' | 'isPublic'>,
  cards: Omit<Card, 'id' | 'createdAt'>[]
): ThunkAction => async (dispatch, getState) => {
  // NOTE: firestore can not store undefined value.
  // Need to convert to empty string instead
  const uid = getState().config.uid;
  if (!uid) {
    alert('You need to log in first');
    return;
  }
  const createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const updatedAt = createdAt;
  const batch = db.batch();
  const docDeck = db.collection('deck').doc();
  const cardIds = [] as string[];
  cards.forEach(async c => {
    const doc = db.collection('card').doc();
    cardIds.push(doc.id);
    const card = {
      ...c,
      deckId: docDeck.id,
      uid,
      createdAt,
      updatedAt,
    };
    batch.set(doc, card);
  });
  const d = {
    ...deck,
    uid,
    createdAt,
    updatedAt,
    cardIds,
  };
  batch.set(docDeck, d);
  await batch.commit();
};

export const deckUpdate = (deck: Deck): ThunkAction => async (
  dispatch,
  getState
) => {
  await db
    .collection('deck')
    .doc(deck.id)
    .set({
      ...deck,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const deckDelete = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  // need to update updatedAt field in order to listen to delete event
  // but don't update card.updatedAt because it wll call a lot of requests
  // so if a deck is deleted, delete its cards together from reducer state
  await dispatch(deckUpdate(getState().deck.byId[deckId]));

  const uid = getState().config.uid;
  const batch = db.batch();
  const doc = db.collection('deck').doc(deckId);
  /*
  // this code has firebase internal error. to avoid this, just call deckUpdate first
  batch.set(
    doc,
    { updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  */
  batch.delete(doc);
  const querySnapshot = await db
    .collection('card')
    .where('uid', '==', uid)
    .get();
  querySnapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// deck.isPublic must be true
export const deckImportPublic = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const doc = await db
    .collection('deck')
    .doc(deckId)
    .get();
  const deck = { ...doc.data(), id: doc.id } as Deck;
  await dispatch(cardFetch(deckId, true));
  await dispatch(type.deckBulkInsert([deck]));
  const cards = Selector.getCardList(getState(), deckId);
  // this method should work even if user is not logged in yet
  const uid = getState().config.uid;
  if (uid) {
    await dispatch(deckCreate(deck, cards));
  } else {
    const d = { ...deck, uid: '' };
    await dispatch(type.deckBulkInsert([d]));
  }
};

export const deckGenerateCsv = (
  deckId: string
): ThunkAction<Promise<string>> => async (dispatch, getState) => {
  const card = getState().card;
  const ids = card.byDeckId[deckId];
  const cards = ids.map(id => card.byId[id]);
  const data = cards.map(cardToRow);
  return Papa.unparse(data);
};

export const cardFetch = (
  deckId: string,
  isPublic: boolean = false
): ThunkAction => async (dispatch, getState) => {
  const uid = getState().config.uid;
  if (!isPublic && !uid) {
    alert('need to login');
    return;
  }
  const query = db.collection('card').where('deckId', '==', deckId);
  let querySnapshot: firebase.firestore.QuerySnapshot;
  if (isPublic) {
    // no need to filter by public deck???
    querySnapshot = await query.get();
    // querySnapshot = await query.where('deck.isPublic', '==', true).get();
  } else {
    // need to include the same condition as defined in security rules
    querySnapshot = await query.where('uid', '==', uid).get();
  }
  const cards = [] as Card[];
  querySnapshot.forEach(doc => {
    const d = doc.data() as Card;
    cards.push({ ...d, id: doc.id });
  });
  dispatch(type.cardBulkInsert(cards));
};

export const cardCreate = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  const docRef = await db.collection('card').add(card);
  await dispatch(type.cardBulkInsert([{ ...card, id: docRef.id }]));
};

export const cardUpdate = (card: Card): ThunkAction => async (
  dispatch,
  getState
) => {
  await db
    .collection('card')
    .doc(card.id)
    .set({
      ...card,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const cardDelete = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const card = getState().card.byId[id];
  const deckRef = db.collection('deck').doc(card.deckId);
  const cardRef = db.collection('card').doc(id);
  try {
    // NOTE: once a deck notified, need to delete the card which belongs to it
    await db.runTransaction(async t => {
      const deckDoc = await t.get(deckRef);
      const deck = deckDoc.data() as Deck;
      const cardIds = pull(deck.cardIds, id);
      await t.update(deckRef, {
        ...deck,
        cardIds,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await t.delete(cardRef);
    });
  } catch (e) {
    console.log(e);
  }
};

export const configUpdate = (config: Partial<ConfigState>) => async (
  dispatch,
  getState
) => {
  dispatch(type.configUpdate(config));
};

export const configToggle = (key: keyof ConfigState): ThunkAction => async (
  dispatch,
  getState
) => {
  dispatch(configUpdate({ [key]: !getState().config[key] }));
};
