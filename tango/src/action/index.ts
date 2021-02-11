import { pull, shuffle } from "lodash";
import * as RN from "react-native";
import * as firebase from "firebase";
import * as Papa from "papaparse";
import { ThunkAction } from "redux-thunk";
import * as C from "src/constant";
import * as type from "src/action/type";
import { db } from "src/firebase";
import moment from "moment";
import * as deck from "./deck";
export { deck }

export type ThunkResult<R = void> = ThunkAction<
  R,
  RootState,
  undefined,
  Action
>;

export const rowToCard = (row: string[]): Partial<Card> => {
  const score = parseInt(row[3]) || 0;
  const tags = typeof row[2] === "string" ? row[2].split(",") : [];
  return {
    frontText: row[0] || "",
    backText: row[1] || "",
    tags,
    score,
  };
};

export const cardToRow = (card: Card): string[] => [
  card.frontText,
  card.backText,
  card.tags.join(","),
  String(card.score),
];

const defaultHeader = {
  "Content-Type": "application/json",
};

const tryFetch = (
  url: string,
  params: {
    method?: "GET" | "POST";
    header?: {};
    body?: string;
    retry?: boolean;
    googleToken?: boolean;
  } = { method: "GET" }
): ThunkResult<any> => async (dispatch, getState) => {
  const { retry = true } = params;
  __DEV__ && console.log("TRY FETCH: ", retry, url);
  const header = { ...defaultHeader, ...params.header } as any;
  if (params.googleToken) {
    const token = getState().config.googleAccessToken;
    header.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: params.method || "GET",
    headers: new Headers(header),
    body: params.body,
  });
  __DEV__ && console.log("RESULT FETCH", res.status, retry);
  if (res.status === 401 && retry) {
    await dispatch(refreshToken());
    return await dispatch(tryFetch(url, { ...params, retry: false }));
  }
  return res;
};

export const deckStart = deck.start;

export const goToCard = (cardId: string): ThunkResult => async (
  dispatch,
  getState
) => {
  const card = getState().card.byId[cardId];
  const deck = getState().deck.byId[card.deckId];
  let currentIndex = deck.cardOrderIds.findIndex((id) => id === cardId);
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

  if (value === "DoNothing") {
    return;
  }

  if (RN.Platform.OS === "android") {
    RN.ToastAndroid.show(C.SWIPE_GESTURES[direction], 0.1);
  }

  await dispatch(type.configUpdate({ lastSwipe: direction }));

  if (value === "GoBack") {
    await dispatch(deckUpdate({ id: deck.id, currentIndex: -1 }));
    return;
  }
  if (config.hideBodyWhenCardChanged) {
    await dispatch(type.configUpdate({ showBackText: false }));
  }

  const numberOfSeen = card.numberOfSeen + 1;
  const lastSeenAt = new Date();

  let score = card.score;
  if (value === "GoToNextCardMastered") {
    score = getCardScore(card, true);
  } else if (value === "GoToNextCardNotMastered") {
    score = getCardScore(card, false);
  } else if (value === "GoToNextCardToggleMastered") {
    score = getCardScore(card);
  }

  let interval = card.interval;
  const index = C.NEXT_SEEING_MINUTES_KEYS.findIndex((i) => i >= interval);
  if (card.score < score && index < C.NEXT_SEEING_MINUTES_KEYS.length - 1) {
    interval = C.NEXT_SEEING_MINUTES_KEYS[index + 1];
  } else if (card.score > score && index > 0) {
    interval = C.NEXT_SEEING_MINUTES_KEYS[index - 1];
  }

  const nextSeeingAt = moment(lastSeenAt).add(interval, "minute").toDate();

  await dispatch(
    type.cardUpdate({
      id: card.id,
      score,
      numberOfSeen,
      interval,
      lastSeenAt,
      nextSeeingAt,
    })
  );

  let currentIndex = deck.currentIndex;
  if (value === "GoToPrevCard") {
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

export const deckCreate = deck.create;
export const deckUpdate = deck.update;
export const deckEditUpdate = deck.edit;
export const deckDelete = deck.remove;
export const deckPubicFetch = deck.pubicFetch;
export const deckPublicImport = deck.publicImport;

export const cardUpdate = (card: Partial<Card> & { id: string }) => async (
  dispatch,
  getState
) => {
  dispatch(type.cardUpdate(card));
  if (!getState().config.uid) return; // not login mode
  await db
    .collection("card")
    .doc(card.id)
    .update({
      ...card,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

// TODO: not login mode
export const cardDelete = (id: string) => async (dispatch, getState) => {
  const card = getState().card.byId[id];
  __DEV__ && console.log("CARD DELETED", card.id, card.deckId);
  const deckRef = db.collection("deck").doc(card.deckId);
  const cardRef = db.collection("card").doc(id);
  // NOTE: once a deck notified, need to delete the card which belongs to it
  await db.runTransaction(async (t) => {
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
  if (RN.Platform.OS === "ios") {
    params.client_id = C.GOOGLE_IOS_CLIENT_ID;
  } else if (RN.Platform.OS === "android") {
    params.client_id = C.GOOGLE_ANDROID_CLIENT_ID;
  } else {
    params.client_id = C.GOOGLE_WEB_CLIENT_ID;
    params.client_secret = C.GOOGLE_WEB_CLIENT_SECRET;
  }
  const res = await dispatch(
    tryFetch("https://accounts.google.com/o/oauth2/token", {
      retry: false,
      method: "POST",
      header: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token,
        grant_type: "refresh_token",
        ...params,
      }).toString(),
    })
  );
  __DEV__ && console.log("REFRESH", res.ok);
  if (res.ok) {
    const json = await res.json();
    await dispatch(type.configUpdate({ googleAccessToken: json.access_token }));
  } else {
    alert("Failed to refresh token");
  }
};

export const sheetFetch = (): ThunkResult => async (dispatch, getState) => {
  const q = encodeURIComponent(
    "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'"
  );
  const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q=${q}&pageSize=1000`;
  const res = await dispatch(tryFetch(url, { googleToken: true }));
  if (!res.ok) {
    alert("Failed to refresh token");
  } else {
    const json = (await res.json()) as { files: any[] };
    const spreadSheets = json.files.filter(
      (f) => f.mimeType === "application/vnd.google-apps.spreadsheet"
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
  const json = (await res.json()) as {
    spreadsheetId: string;
    sheets: { properties: { title: string; sheetId: string } }[];
  };
  const sheets = json.sheets.map((s) => ({
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
    alert("Can not upload");
    return;
  }
  const state = getState();
  const cards = deck.cardIds.map((id) => state.card.byId[id]);
  const values = cards.map(cardToRow);
  const [spreadSheetId, title] = deck.sheetId!.split("::", 2);
  const range = encodeURIComponent(`${title}!A:E`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${range}?valueInputOption=RAW`;
  const headers = {
    Authorization: `Bearer ${getState().config.googleAccessToken}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: new Headers(headers),
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    alert("Status code is not ok");
  }
};

export const parseByText = (
  text: string,
  deck: Pick<Deck, "name" | "url" | "sheetId">
): ThunkResult => async (dispatch, getState) => {
  const results = Papa.parse<string[]>(text);
  const cards = results.data
    .map(rowToCard)
    .filter((c) => !!c.frontText) as Card[];
  __DEV__ && console.log("DEBUG: CSV COMPLETE", cards.length);
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
  const name = url.split("/").pop() || "sample";
  await dispatch(parseByText(text, { name, url }));
};

export const sheetImport = (id: string): ThunkResult => async (
  dispatch,
  getState
) => {
  const sheet = getState().download.sheetById[id];
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
