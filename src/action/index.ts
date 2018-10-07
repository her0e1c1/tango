import * as firebase from 'firebase';
import * as Papa from 'papaparse';
import * as queryString from 'query-string';

import * as C from 'src/constant';
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

export const refreshToken = (): ThunkAction<Promise<boolean>> => async (
  dispatch,
  getState
) => {
  const refresh_token = getState().config.googleRefreshToken;
  if (!refresh_token) {
    console.log(`You can't refresh`);
    return false;
  }
  const body = queryString.stringify({
    refresh_token,
    grant_type: 'refresh_token',
    client_id: C.GOOGLE_WEB_CLIENT_ID,
    client_secret: C.GOOGLE_WEB_CLIENT_SECRET,
  });
  const json = await fetch('https://accounts.google.com/o/oauth2/token', {
    method: 'POST',
    body,
    headers: new Headers({
      'content-type': 'application/x-www-form-urlencoded',
    }),
  }).then(r => r.json());
  await dispatch(configUpdate({ googleAccessToken: json.access_token }));
  return true;
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

/*
export const importFromSpreadSheet = (
  drive: Drive,
  sheet: Sheet
): ThunkAction => async (dispatch, getState) => {
  const gid = sheet.properties.sheetId;
  try {
    await dispatch(Action.config.startLoading());
    const res = await dispatch(
      fetchAPI(
        `https://docs.google.com/spreadsheets/d/${
          drive.id
        }/export?gid=${gid}&exportFormat=csv`
      )
    );
    if (res.ok) {
      const text = await res.text();
      await dispatch(
        Action.deck.insertByText(text, {
          name: sheet.properties.title,
          spreadsheetId: drive.id,
          spreadsheetGid: String(gid),
        })
      );
    } else {
      alert('CAN NOT IMPORT');
    }
  } catch (e) {
    console.log(e);
  } finally {
    await dispatch(Action.config.endLoading());
  }
};
*/

export const setEventListener = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  db.collection('deck')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        const id = change.doc.id;
        const deck = change.doc.data() as Deck;
        if (change.type === 'added') {
          dispatch(type.deckBulkInsert([{ ...deck, id }]));
        } else if (change.type === 'modified') {
          dispatch(type.deckBulkInsert([deck]));
        } else if (change.type === 'removed') {
          dispatch(type.deckDelete(id));
        }
      });
    });
  /*
  db.collection('card')
    .where('uid', '==', uid)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        const id = change.doc.id;
        const card = change.doc.data() as Card;
        if (change.type === 'added') {
          // dispatch(type.cardBulkInsert([{ ...card, id }]));
        } else if (change.type === 'modified') {
          dispatch(type.cardBulkInsert([card]));
        } else if (change.type === 'removed') {
          dispatch(type.cardDelete(id));
        }
      });
    });
  */
};

export const deckFetch = (
  isPublic: boolean = false
): ThunkAction<Promise<Deck[]>> => async (dispatch, getState) => {
  const uid = getState().config.uid;
  if (!isPublic && !uid) {
    alert('need to login');
    return [];
  }
  const query = db.collection('deck').orderBy('createdAt');
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
  if (uid) {
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(doc, card);
      //  dispatch(type.cardBulkInsert([{ ...card, id: doc.id }]));
    });
    const d = {
      ...deck,
      uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      cardIds,
    };
    batch.set(docDeck, d);
    // dispatch(type.deckBulkInsert([{ ...d, id: docDeck.id }]));
    await batch.commit();
  } else {
    alert('You need to log in first');
  }
};

export const deckUpdate = (deck: Deck): ThunkAction => async (
  dispatch,
  getState
) => {
  await db
    .collection('deck')
    .doc(deck.id)
    .set({ ...deck });
  // dispatch(type.deckBulkInsert([deck]));
};

export const deckDelete = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const querySnapshot = await db
    .collection('card')
    .where('deckId', '==', deckId)
    .where('uid', '==', getState().config.uid)
    .get();
  const batch = db.batch();
  batch.delete(db.collection('deck').doc(deckId));
  querySnapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  // await dispatch(type.deckBulkDelete([deckId]));
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
    .set(card);
  await dispatch(type.cardBulkInsert([card]));
};

export const cardDelete = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  await db
    .collection('card')
    .doc(id)
    .delete();
  await dispatch(type.cardDelete(id));
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
