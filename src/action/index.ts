import { pull, shuffle } from 'lodash';
import * as firebase from 'firebase/app';
import * as Papa from 'papaparse';

import * as type from './type';
import { db } from 'src/firebase';
import * as C from 'src/constant';
import * as queryString from 'query-string';
import { getSelector, CardModel, DeckModel } from 'src/selector';

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

export const loadingStart = (): ThunkAction => async (dispatch, getState) => {
  dispatch(
    type.configUpdate({ loadingCount: getState().config.loadingCount + 1 })
  );
};

export const loadingEnd = (): ThunkAction => async (dispatch, getState) => {
  dispatch(
    type.configUpdate({ loadingCount: getState().config.loadingCount - 1 })
  );
};

export const logout = (): ThunkAction => async (dispatch, getState) => {
  await firebase.auth().signOut();
  dispatch(type.clearAll());
};

export const refreshToken = (type: {
  ios: boolean;
  android: boolean;
}): ThunkAction => async (dispatch, getState) => {
  const refresh_token = getState().config.googleRefreshToken;
  if (!refresh_token) {
    console.log(`You can't refresh`);
    return;
  }
  const params = {} as any;
  if (type.ios) {
    params.client_id = C.GOOGLE_IOS_CLIENT_ID;
  } else if (type.android) {
    params.client_id = C.GOOGLE_ANDROID_CLIENT_ID;
  } else {
    params.client_id = C.GOOGLE_WEB_CLIENT_ID;
    params.client_secret = C.GOOGLE_WEB_CLIENT_SECRET;
  }
  const body = queryString.stringify({
    refresh_token,
    grant_type: 'refresh_token',
    ...params,
  });
  const res = await fetch('https://accounts.google.com/o/oauth2/token', {
    method: 'POST',
    body,
    headers: new Headers({
      'content-type': 'application/x-www-form-urlencoded',
    }),
  });
  if (!res.ok) return alert(`${res.statusText}`);
  const json = await res.json();
  await dispatch(configUpdate({ googleAccessToken: json.access_token }));
};

export const insertByURL = (url: string): ThunkAction => async (
  dispatch,
  _getState
) => {
  __DEV__ && console.log(`FETCH START: ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(
    parseByText(text, {
      name,
      url,
    })
  );
};

export const setEventListener = (): ThunkAction => async (
  dispatch,
  getState
) => {
  const state = getState();
  const uid = state.config.uid;
  if (!uid) {
    return; // after user log in, then call this function
  }
  if (Object.keys(state.deck.byId).length === 0) {
    await dispatch(loadingStart());
    const decks = await dispatch(deckFetch());
    decks.forEach(async d => await dispatch(cardFetch(d.id)));
    await dispatch(configUpdate({ lastUpdatedAt: new Date().getTime() }));
    await dispatch(loadingEnd());
  }
  // FIXME: maybe client timestamp is different from server's one
  const updatedAt = getState().config.lastUpdatedAt;
  __DEV__ && console.log('LAST UPDATED AT: ', new Date(updatedAt));
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
        // when initialized, modified event is not triggered but added is after updating deletedAt
        if (deck.deletedAt != null) {
          dispatch(type.deckDelete(id));
        } else if (change.type === 'added') {
          decks.push(deck);
        } else if (change.type === 'modified') {
          decks.push(deck);
        } else if (change.type === 'removed') {
          // NOT REACHED
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

export const deckFetch = (props?: {
  isPublic: boolean;
}): ThunkAction<Promise<Deck[]>> => async (dispatch, getState) => {
  const isPublic = props && props.isPublic;
  const uid = getState().config.uid;
  if (!isPublic && !uid) {
    alert('need to login');
    return [];
  }
  const query = db.collection('deck').where('deletedAt', '==', null);
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

export const deckSwipeStart = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const selector = getSelector(getState());
  const deck = selector.deck.getByIdOrEmpty(deckId);
  let cardOrderIds = [...deck.cardIds];
  if (getState().config.shuffled) {
    cardOrderIds = shuffle(cardOrderIds);
  }
  await dispatch(
    type.deckInsert({ id: deck.id, currentIndex: 0, cardOrderIds } as Deck)
  );
};

export const deckCreate = (
  deck: Pick<Deck, 'name' | 'sheetId' | 'url'>,
  cards: Omit<Card, 'id' | 'createdAt'>[]
): ThunkAction => async (dispatch, getState) => {
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
      // ...c,  // maybe pass CardModel here
      tags: c.tags,
      frontText: c.frontText,
      backText: c.backText,
      hint: c.hint,
      id: doc.id,
      deckId: docDeck.id,
      uid,
      createdAt,
      updatedAt,
    };
    batch.set(doc, card);
  });
  const d = {
    // ...deck,
    id: docDeck.id,
    name: deck.name,
    sheetId: deck.sheetId || null,
    url: deck.url || null,
    isPublic: false,
    uid,
    createdAt,
    updatedAt,
    cardIds,
    deletedAt: null,
  };
  batch.set(docDeck, d);
  await batch.commit();
};

export const deckUpdate = (deck: Deck): ThunkAction => async (
  dispatch,
  getState
) => {
  const dm = new DeckModel(deck.id, getSelector(getState()));
  await db
    .collection('deck')
    .doc(deck.id)
    .set({
      ...dm.toJSON(deck),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const deckDelete = (deckId: string): ThunkAction => async (
  dispatch,
  getState
) => {
  // For deck, using soft delete flag with deletedAt
  // here update updatedAt, deletedAt and cardIds in deck.
  await dispatch(deckUpdate(getState().deck.byId[deckId]));

  const uid = getState().config.uid;
  const batch = db.batch();
  const querySnapshot = await db
    .collection('card')
    .where('uid', '==', uid)
    .where('deckId', '==', deckId)
    .get();
  querySnapshot.forEach(doc => batch.delete(doc.ref));
  const doc = db.collection('deck').doc(deckId);
  batch.update(doc, {
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
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

  const cards = getSelector(getState()).card.deckId(deckId);
  // this method should work even if user is not logged in yet
  const uid = getState().config.uid;
  if (uid) {
    await dispatch(deckCreate(deck, cards));
  } else {
    const d = { ...deck, uid: '' };
    await dispatch(type.deckInsert(d));
  }
};

export const deckGenerateCsv = (
  deckId: string
): ThunkAction<Promise<string>> => async (dispatch, getState) => {
  const deck = getState().deck.byId[deckId];
  const card = getState().card;
  const cards = deck.cardIds
    .map((id, i) => {
      const c = card.byId[id];
      if (c === undefined) {
        console.error('DEBUG INVALID CARD: ', id, i);
      }
      return c;
    })
    .filter(c => !!c);
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

export const cardCreate = (card: Omit<Card, 'id'>): ThunkAction => async (
  dispatch,
  getState
) => {
  const uid = getState().config.uid;
  const deckRef = db.collection('deck').doc(card.deckId);
  const cardRef = db.collection('card').doc();
  await db.runTransaction(async t => {
    const deckDoc = await t.get(deckRef); // need to call first
    await t.set(cardRef, {
      frontText: '',
      backText: '',
      hint: '',
      tags: [],
      ...card,
      uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    const deck = deckDoc.data() as Deck;
    const cardIds = [...deck.cardIds, cardRef.id];
    await t.update(deckRef, {
      ...deck,
      cardIds,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
};

export const cardUpdate = (card: Card): ThunkAction => async (
  _dispatch,
  getState
) => {
  const cm = new CardModel(card.id, getSelector(getState()));
  await db
    .collection('card')
    .doc(card.id)
    .set({
      ...cm.toJSON(card),
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

export const cardFetchFromUrl = async (
  url: string,
  start?: number,
  end?: number
): Promise<string> => {
  const res = await fetch(url);
  const text = await res.text();
  const s = text.split('\n');
  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = s.length - 1;
  }
  return s.slice(start, end).join('\n');
};

const papaComplete = async (results): Promise<Card[]> => {
  const cards = results.data
    .map(rowToCard)
    .filter(c => !!c.frontText) as Card[];
  for (let c of cards) {
    if (c.tags.includes('url')) {
      const s = c.backText.split(/#L(\d+)(-L(\d+))?/);
      c.backText = await cardFetchFromUrl(s[0], Number(s[1]), Number(s[3]));
    }
  }
  __DEV__ && console.log('DEBUG: CSV COMPLETE', results, cards);
  return cards;
};

export const parseByText = (
  text: string,
  deck: Pick<Deck, 'name' | 'url' | 'sheetId'>
): ThunkAction => async (dispatch, _getState) => {
  const cards = await papaComplete(Papa.parse(text));
  dispatch(deckCreate(deck, cards));
};

export const parseByFile = (file: File): ThunkAction => (
  _dispatch,
  _getState
) => {
  return new Promise((resolve, _reject) =>
    Papa.parse(file, {
      complete: async results => resolve(await papaComplete(results)),
    })
  );
};

export const sheetFetch = (): ThunkAction => async (dispatch, getState) => {
  const state = getState();
  const q = encodeURIComponent(
    "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'"
  );
  const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q=${q}&pageSize=1000`;
  const headers = {
    Authorization: `Bearer ${state.config.googleAccessToken}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method: 'GET',
    headers: new Headers(headers),
  });
  const json = (await res.json()) as {
    files: { kind: string; id: string; mimeType: string; name: string }[];
  };
  if (!res.ok) {
    alert(`ERROR: ${JSON.stringify(json)}`);
    return;
  }
  const spreadSheets = (json.files || []).filter(
    f => f.mimeType === 'application/vnd.google-apps.spreadsheet'
  );

  for (let ss of spreadSheets) {
    const url2 = `https://sheets.googleapis.com/v4/spreadsheets/${ss.id}`;
    const res2 = await fetch(url2, {
      method: 'GET',
      headers: new Headers(headers),
    });
    const json2 = (await res2.json()) as {
      spreadsheetId: string;
      sheets: { properties: { title: string; sheetId: string } }[];
    };
    const sheets = json2.sheets.map(s => ({
      id: `${ss.id}::${s.properties.title}`,
      index: s.properties.sheetId,
      title: s.properties.title,
      name: ss.name,
      spreadSheetId: ss.id,
    })) as Sheet[];
    dispatch(type.sheetBulkInsert(sheets));
  }
};

export const sheetImport = (id: string): ThunkAction => async (
  dispatch,
  getState
) => {
  const state = getState();
  const sheet = state.sheet.byId[id];
  const url = `https://docs.google.com/spreadsheets/d/${
    sheet.spreadSheetId
  }/export?gid=${sheet.index}&exportFormat=csv`;
  const headers = {
    Authorization: `Bearer ${state.config.googleAccessToken}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method: 'GET',
    headers: new Headers(headers),
  });
  const text = await res.text();
  dispatch(
    parseByText(text, {
      name: `${sheet.title} (${sheet.name})`,
      sheetId: sheet.id,
    })
  );
};

export const sheetUpload = (
  deck: Deck
): ThunkAction<Promise<boolean>> => async (_dispatch, getState) => {
  const selector = getSelector(getState());
  if (!deck.sheetId) {
    alert('CAN NOT UPLOAD');
    return false;
  }

  const [spreadSheetId, title] = deck.sheetId.split('::', 2);
  const cards = selector.card.deckId(deck.id);
  const values = cards.map(cardToRow);
  const range = encodeURIComponent(`${title}!A:E`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${range}?valueInputOption=RAW`;
  const headers = {
    Authorization: `Bearer ${getState().config.googleAccessToken}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: new Headers(headers),
    body: JSON.stringify({ values }),
  });
  return res.ok;
};
