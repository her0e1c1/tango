import { pull, shuffle } from 'lodash';
import * as RN from 'react-native';
import * as firebase from 'firebase/app';
import * as Papa from 'papaparse';
import { ThunkAction } from 'redux-thunk';
import * as C from 'src/constant';
import * as type from 'src/action/type';
import { db } from 'src/firebase';

type ThunkResult<R = void> = ThunkAction<R, RootState, undefined, Action>;

export const rowToCard = (row: string[]): Partial<Card> => ({
  frontText: row[0] || '',
  backText: row[1] || '',
  tags: row[2] ? row[3].split(',') : [],
  score: row[3] ? parseInt(row[3]) : 0,
});

export const cardToRow = (card: Card): string[] => [
  card.frontText,
  card.backText,
  card.tags.join(','),
  String(card.score),
];

const papaComplete = async (results): Promise<Card[]> => {
  const cards = results.data
    .map(rowToCard)
    .filter(c => !!c.frontText) as Card[];
  __DEV__ && console.log('DEBUG: CSV COMPLETE', cards.length);
  return cards;
};

const defaultHeader = {
  'Content-Type': 'application/json',
};

const tryFetch = (
  url: string,
  params: {
    method?: 'GET' | 'POST';
    header?: {};
    body?: string;
    retry?: boolean;
    googleToken?: boolean;
  } = { method: 'GET' }
): ThunkResult<any> => async (dispatch, getState) => {
  const { retry = true } = params;
  __DEV__ && console.log('TRY FETCH: ', retry, url);
  const header = { ...defaultHeader, ...params.header } as any;
  if (params.googleToken) {
    const token = getState().config.googleAccessToken;
    header.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: params.method || 'GET',
    headers: new Headers(header),
    body: params.body,
  });
  __DEV__ && console.log('RESULT FETCH', res.status, retry);
  if (res.status === 401 && retry) {
    await dispatch(refreshToken());
    return await dispatch(tryFetch(url, { ...params, retry: false }));
  }
  return res;
};

export const deckStart = (cards: Card[]): ThunkResult => async (
  dispatch,
  getState
) => {
  const deckId = cards[0].deckId; // caller cares!
  const config = getState().config;
  let cardOrderIds = cards.map(c => c.id);
  if (config.shuffled) {
    cardOrderIds = shuffle(cardOrderIds);
  }
  if (config.maxNumberOfCardsToLearn > 0) {
    cardOrderIds = cardOrderIds.slice(0, config.maxNumberOfCardsToLearn);
  }
  await dispatch(deckUpdate({ id: deckId, currentIndex: 0, cardOrderIds }));
  await dispatch(
    type.configUpdate({
      showBackText: false,
      autoPlay: config.defaultAutoPlay,
    })
  );
};

export const goToCard = (cardId): ThunkResult => async (dispatch, getState) => {
  const card = getState().card.byId[cardId];
  const deck = getState().deck.byId[card.deckId];
  let currentIndex = deck.cardOrderIds.findIndex(id => id === cardId);
  if (currentIndex === -1) currentIndex = 0;
  await dispatch(deckUpdate({ id: deck.id, currentIndex }));
};

const getCardScore = (card: Card, mastered?: boolean) => {
  let score;
  if (mastered === true) {
    score = card.score >= 0 ? card.score + 1 : 0;
  } else if (mastered === false) {
    score = card.score <= 0 ? card.score - 1 : 0;
  } else {
    score = 0;
  }
  return score;
};

export const deckSwipe = (
  direction: SwipeDirection,
  deckId: string
): ThunkResult => async (dispatch, getState) => {
  const deck = getState().deck.byId[deckId];
  const cardId = deck.cardOrderIds[deck.currentIndex];
  const card = getState().card.byId[cardId];
  const config = getState().config;
  const value = config[direction];

  if (value === 'GoBack') {
    await dispatch(deckUpdate({ id: deck.id, currentIndex: -1 }));
    return;
  }
  if (config.hideBodyWhenCardChanged) {
    await dispatch(type.configUpdate({ showBackText: false }));
  }

  const numberOfSeen = card.numberOfSeen + 1;
  const lastSeenAt = new Date();

  let score;
  if (value === 'GoToNextCardMastered') {
    score = getCardScore(card, true);
  } else if (value === 'GoToNextCardNotMastered') {
    score = getCardScore(card, false);
  } else if (value === 'GoToNextCardToggleMastered') {
    score = getCardScore(card);
  }

  await dispatch(
    type.cardUpdate({ id: card.id, score, numberOfSeen, lastSeenAt })
  );

  let currentIndex = deck.currentIndex;
  if (value === 'GoToPrevCard') {
    currentIndex -= 1;
  } else {
    currentIndex += 1;
  }
  if (0 <= currentIndex && currentIndex < deck.cardOrderIds.length) {
    await dispatch(deckUpdate({ id: deck.id, currentIndex }));
  } else {
    await dispatch(deckUpdate({ id: deck.id, currentIndex: -1 }));
  }
};

export const deckCreate = (
  deck: Pick<Deck, 'name' | 'sheetId' | 'url'>,
  cards: Omit<Card, 'id' | 'createdAt'>[]
): ThunkResult => async (dispatch, getState) => {
  const uid = getState().config.uid;
  const createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const updatedAt = createdAt;
  const batch = db.batch();
  const docDeck = db.collection('deck').doc();
  const cardIds = [] as string[];
  const insertedCards = [] as any[]; // TODO: fix any
  cards.forEach(c => {
    const doc = db.collection('card').doc();
    cardIds.push(doc.id);
    const card = {
      ...c,
      id: doc.id,
      deckId: docDeck.id,
      uid,
      createdAt,
      updatedAt,
    };
    batch.set(doc, card);
    insertedCards.push(card);
  });
  const d = {
    ...deck,
    id: docDeck.id,
    uid,
    createdAt,
    updatedAt,
    cardIds,
    scoreMax: null,
    sheetId: deck.sheetId || null,
    url: deck.url || null,
    isPublic: false,
    deletedAt: null,
  } as any; // TODO: fix any
  batch.set(docDeck, d);
  if (uid) await batch.commit(); // not login mode
  await dispatch(type.deckInsert(d));
  await dispatch(type.cardBulkInsert(insertedCards));
};

export const deckUpdate = (deck: Partial<Deck> & { id: string }) => async (
  dispatch,
  getState
) => {
  dispatch(type.deckUpdate(deck));
  if (!getState().config.uid) return; // not login mode
  if (!deck.uid) return; // imported public deck
  db.collection('deck')
    .doc(deck.id)
    .update({
      ...deck,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const deckEditUpdate = (): ThunkResult => async (dispatch, getState) => {
  const edit = getState().deck.edit;
  await dispatch(deckUpdate(edit));
};

// For deck, using soft delete flag with deletedAt
// here update updatedAt, deletedAt and cardIds in deck.
export const deckDelete = (deckId: string) => async (dispatch, getState) => {
  const deck = getState().deck.byId[deckId];
  if (!deck.uid) {
    // not imported public deck
    dispatch(type.deckDelete(deckId));
    return;
  }
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
  if (uid) await batch.commit(); // not login mode
  dispatch(type.deckDelete(deckId));
};

export const deckPubicFetch = () => async (dispatch, getState) => {
  const query = db
    .collection('deck')
    .where('deletedAt', '==', null)
    .where('isPublic', '==', true);
  // .orderBy('updatedAt', 'desc');
  let querySnapshot: firebase.firestore.QuerySnapshot;
  querySnapshot = await query.get();
  const decks = [] as Deck[];
  querySnapshot.forEach(doc => {
    const d = doc.data() as Deck;
    decks.push({ ...d, id: doc.id });
  });
  await dispatch(type.deckPublicBulkInsert(decks));
};

export const deckPublicImport = (deckId: string) => async (
  dispatch,
  getState
) => {
  // no need to filter by public deck?
  // where('deck.isPublic', '==', true)
  const querySnapshot = await db
    .collection('card')
    .where('deckId', '==', deckId)
    .get();
  const cards = [] as Card[];
  querySnapshot.forEach(doc => {
    const d = doc.data() as Card;
    cards.push({ ...d, id: doc.id });
  });

  const querySnapshot2 = await db
    .collection('deck')
    .where('id', '==', deckId)
    .where('isPublic', '==', true)
    .get();
  querySnapshot2.forEach(doc => {
    const d = doc.data() as Deck;
    dispatch(type.deckInsert({ ...d, uid: '' }));
  });

  await dispatch(type.cardBulkInsert(cards));
};

export const cardUpdate = (card: Partial<Card> & { id: string }) => async (
  dispatch,
  getState
) => {
  dispatch(type.cardUpdate(card));
  if (!getState().config.uid) return; // not login mode
  await db
    .collection('card')
    .doc(card.id)
    .update({
      ...card,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

// TODO: not login mode
export const cardDelete = (id: string) => async (dispatch, getState) => {
  const card = getState().card.byId[id];
  __DEV__ && console.log('CARD DELETED', card.id, card.deckId);
  const deckRef = db.collection('deck').doc(card.deckId);
  const cardRef = db.collection('card').doc(id);
  // NOTE: once a deck notified, need to delete the card which belongs to it
  await db.runTransaction(async t => {
    const deckDoc = await t.get(deckRef);
    const deck = deckDoc.data() as Deck;
    const cardIds = pull(deck.cardIds, id);
    await t.update(deckRef, {
      cardIds,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await t.delete(cardRef);
  });
};

export const cardEditUpdate = (): ThunkResult => async (dispatch, getState) => {
  const edit = getState().card.edit;
  await dispatch(cardUpdate(edit));
};

export const configToggle = (key: keyof ConfigState) => async (
  dispatch,
  getState
) => {
  const value = getState().config[key];
  dispatch(type.configUpdate({ [key]: !value }));
};

// FIXME: I don't know but there is no refresh token for web.
export const refreshToken = (): ThunkResult => async (dispatch, getState) => {
  const refresh_token = getState().config.googleRefreshToken;
  if (!refresh_token) throw `You can't refresh`;
  const params = {} as any;
  if (RN.Platform.OS === 'ios') {
    params.client_id = C.GOOGLE_IOS_CLIENT_ID;
  } else if (RN.Platform.OS === 'android') {
    params.client_id = C.GOOGLE_ANDROID_CLIENT_ID;
  } else {
    params.client_id = C.GOOGLE_WEB_CLIENT_ID;
    params.client_secret = C.GOOGLE_WEB_CLIENT_SECRET;
  }
  const res = await dispatch(
    tryFetch('https://accounts.google.com/o/oauth2/token', {
      retry: false,
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token,
        grant_type: 'refresh_token',
        ...params,
      }).toString(),
    })
  );
  __DEV__ && console.log('REFRESH', res.ok);
  if (res.ok) {
    const json = await res.json();
    await dispatch(type.configUpdate({ googleAccessToken: json.access_token }));
  } else {
    alert('Failed to refresh token');
  }
};

export const sheetFetch = (): ThunkResult => async (dispatch, getState) => {
  const q = encodeURIComponent(
    "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'"
  );
  const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q=${q}&pageSize=1000`;
  const res = await dispatch(tryFetch(url, { googleToken: true }));
  if (!res.ok) {
    alert('Failed to refresh token');
  } else {
    const json = (await res.json()) as { files: any[] };
    const spreadSheets = json.files.filter(
      f => f.mimeType === 'application/vnd.google-apps.spreadsheet'
    );
    for (let ss of spreadSheets) {
      await dispatch(spreadSheetFetch(ss.id, ss.name));
    }
  }
};

export const spreadSheetFetch = (
  id: string,
  name: string
): ThunkResult => async (dispatch, getState) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
  const res = await dispatch(tryFetch(url, { googleToken: true }));
  if (!res.ok) {
    return;
  }
  const json = (await res.json()) as ({
    spreadsheetId: string;
    sheets: { properties: { title: string; sheetId: string } }[];
  });
  const sheets = json.sheets.map(s => ({
    id: `${id}::${s.properties.title}`,
    index: s.properties.sheetId,
    title: s.properties.title,
    name: name,
    spreadSheetId: id,
  })) as Sheet[];
  dispatch(type.sheetBulkInsert(sheets));
};

export const sheetUpload = (deck: Deck): ThunkResult => async (
  _dispatch,
  getState
) => {
  if (!deck.sheetId) {
    alert('Can not upload');
    return;
  }
  const state = getState();
  const cards = deck.cardIds.map(id => state.card.byId[id]);
  const values = cards.map(cardToRow);
  const [spreadSheetId, title] = deck.sheetId!.split('::', 2);
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
  if (!res.ok) {
    alert('Status code is not ok');
  }
};

export const parseByText = (
  text: string,
  deck: Pick<Deck, 'name' | 'url' | 'sheetId'>
): ThunkResult => async (dispatch, getState) => {
  const cards = await papaComplete(Papa.parse(text));
  await dispatch(deckCreate(deck, cards));
};

export const importByURL = (url: string): ThunkResult => async (
  dispatch,
  _getState
) => {
  if (!url) {
    alert(`Invalid URL`);
    return;
  }
  const res = await dispatch(tryFetch(url));
  if (!res.ok) {
    alert(`HTTP response ${res.status}`);
    return;
  }
  const text = await res.text();
  const name = url.split('/').pop() || 'sample';
  await dispatch(parseByText(text, { name, url }));
};

export const sheetImport = (id: string): ThunkResult => async (
  dispatch,
  getState
) => {
  const sheet = getState().sheet.byId[id];
  const url = `https://docs.google.com/spreadsheets/d/${sheet.spreadSheetId}/export?gid=${sheet.index}&exportFormat=csv`;
  const res = await dispatch(tryFetch(url, { googleToken: true }));
  if (!res.ok) {
    alert(`You can not download sheet ${id}`);
  } else {
    const text = await res.text();
    await dispatch(
      parseByText(text, {
        name: `${sheet.title} (${sheet.name})`,
        sheetId: sheet.id,
      })
    );
  }
};
