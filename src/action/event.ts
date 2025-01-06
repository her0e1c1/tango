import { signOut, linkWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential, User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

import { isNonEmpty } from "../util";
import * as type from "./type";
import * as action from ".";
import * as firestore from "./firestore";
import { type ThunkResult } from "./index";

const subscriptions = [] as Callback[];

const unsubscribe = () => {
  while (subscriptions.length > 0) {
    const f = subscriptions.pop();
    f && f();
  }
};

export const logout = (): ThunkResult => async (dispatch) => {
  unsubscribe();
  await signOut(getAuth());
  await dispatch(type.clearAll());
  await dispatch(init());
};

const getDisplayName = (user: User) => {
  if (user.providerData.length > 0) {
    return user.providerData[0].displayName;
  }
};

export const init = (): ThunkResult => async (dispatch, getState) => {
  const auth = getAuth();
  const isAnonymous = getState().config.isAnonymous;
  if (isAnonymous) {
    await signInAnonymously(auth);
  }
  auth.onAuthStateChanged((user) => {
    process.env.NODE_ENV !== "production" &&
      console.log("INIT", user?.isAnonymous, new Date(getState().config.lastUpdatedAt));
    if (user == null) return; // Also called after logout
    dispatch(
      type.configUpdate({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        displayName: getDisplayName(user),
      })
    );
    void dispatch(action.event.subscribe(user.uid));
    void dispatch(action.deck.loadSample());
  });
};

export const removeFromLocal = (): ThunkResult => async (dispatch, getState) => {
  const ids = [] as string[];
  for (const id of Object.keys(getState().deck.byId)) {
    const ok = await firestore.deck.exists(id);
    if (!ok) {
      dispatch(type.deckDelete(id));
    } else {
      ids.push(id);
    }
  }
  for (const [id, card] of Object.entries(getState().card.byId)) {
    if (card == null || !ids.includes(card.deckId)) {
      dispatch(type.cardDelete(id));
    }
  }
};

export const deckOnChange =
  (event: Partial<DeckEvent>): ThunkResult =>
  async (dispatch) => {
    if (isNonEmpty(event.added)) {
      dispatch(type.deckBulkInsert(event.added));
    }
    if (isNonEmpty(event.modified)) {
      dispatch(type.deckBulkInsert(event.modified));
    }
    if (isNonEmpty(event.removed)) {
      dispatch(type.deckBulkDelete(event.removed));
    }
    if (event.lastUpdatedAt) {
      dispatch(type.configUpdate({ lastUpdatedAt: event.lastUpdatedAt }));
    }
  };

export const cardOnChange =
  (event: Partial<CardEvent>): ThunkResult =>
  async (dispatch) => {
    if (isNonEmpty(event.added)) {
      dispatch(type.cardBulkInsert(event.added));
    }
    if (isNonEmpty(event.modified)) {
      dispatch(type.cardBulkInsert(event.modified));
    }
    if (isNonEmpty(event.removed)) {
      dispatch(type.cardBulkDelete(event.removed));
    }
    if (event.lastUpdatedAt) {
      dispatch(type.configUpdate({ lastUpdatedAt: event.lastUpdatedAt }));
    }
  };

export const subscribe =
  (uid: string): ThunkResult =>
  async (dispatch, getState) => {
    unsubscribe();
    const updatedAt = getState().config.lastUpdatedAt;
    const unSubscribeDeck = firestore.event.subscribeDeck({
      uid,
      updatedAt,
      onCange: (event) => {
        process.env.NODE_ENV !== "production" && console.log("SNAPSHOT DECK: ", event.metadata);
        void dispatch(deckOnChange(event));
      },
    });
    const unSubscribeCard = firestore.event.subscribeCard({
      uid,
      updatedAt,
      onCange: (event) => {
        process.env.NODE_ENV !== "production" && console.log("SNAPSHOT CARD: ", event.metadata);
        void dispatch(cardOnChange(event));
      },
    });
    subscriptions.push(unSubscribeDeck);
    subscriptions.push(unSubscribeCard);
  };

export const loginGoogle = (): ThunkResult => async (dispatch) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("must sign in anonymously in advance");
    return;
  }
  let result: UserCredential | null = null;
  try {
    result = await linkWithPopup(currentUser, new GoogleAuthProvider());
  } catch (e) {
    if (e instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(e);
      if (credential) {
        result = await signInWithCredential(auth, credential);
      }
    }
  }
  if (!result) {
    throw Error("failed to login");
  }
  process.env.NODE_ENV !== "production" && console.log("LOGIN GOOGLE", result);
  const { user } = result;
  await dispatch(
    type.configUpdate({
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      displayName: getDisplayName(user),
      lastUpdatedAt: 0, // reset for anonymous user
    })
  );
  await dispatch(subscribe(user.uid));
};
