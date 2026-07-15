import { signOut, linkWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import type { UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { isNonEmpty } from "@/util";
import * as type from "@/action/type";
import * as firestore from "@/action/firestore";
import type { ThunkResult } from "@/action/index";
import { clearStudyStore } from "@/features/study/state/studyStore";
import { getRealtimeLastUpdatedAt } from "@/lib/realtimeChange";
import { publishAuthenticatedUser, suspendAnonymousBootstrap } from "@/auth/AuthContext";
import { auth } from "@/firebase";
import { cleanupFirestoreUid } from "@/query/cleanup";
import { registerSubscription, stopSubscriptions } from "@/lib/realtimeSubscriptions";

export { stopSubscriptions } from "@/lib/realtimeSubscriptions";

export const logout =
  (confirmedUid: string): ThunkResult =>
  async (dispatch) => {
    const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
    try {
      await signOut(auth);
      const errors: unknown[] = [];
      const run = async (step: () => unknown | Promise<unknown>) => {
        try {
          await step();
        } catch (error) {
          errors.push(error);
        }
      };

      await run(() => cleanupFirestoreUid(confirmedUid));
      await run(clearStudyStore);
      await run(() => dispatch(type.clearAll()));
      if (errors.length > 0) {
        throw errors[0];
      }
    } finally {
      resumeAnonymousBootstrap();
    }
  };

export const removeFromLocal = (): ThunkResult => async (dispatch, getState) => {
  const ids = [] as string[];
  for (const [id, deck] of Object.entries(getState().deck.byId)) {
    if (!deck || deck.localMode) {
      continue;
    }
    const ok = await firestore.deck.exists(id);
    if (!ok) {
      dispatch(type.deckDelete(id));
      ids.push(id);
    }
  }
  for (const [id, card] of Object.entries(getState().card.byId)) {
    if (card == null || ids.includes(card.deckId)) {
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
    const lastUpdatedAt = getRealtimeLastUpdatedAt(event);
    if (lastUpdatedAt) {
      dispatch(type.configUpdate({ lastUpdatedAt }));
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
    const lastUpdatedAt = getRealtimeLastUpdatedAt(event);
    if (lastUpdatedAt) {
      dispatch(type.configUpdate({ lastUpdatedAt }));
    }
  };

export const subscribe =
  (uid: string): ThunkResult =>
  async (dispatch, getState) => {
    stopSubscriptions();
    const updatedAt = getState().config.lastUpdatedAt;
    try {
      const unSubscribeDeck = firestore.event.subscribeDeck({
        uid,
        updatedAt,
        onCange: (event) => {
          process.env.NODE_ENV !== "production" && console.log("SNAPSHOT DECK: ", event.metadata);
          void dispatch(deckOnChange(event));
        },
      });
      registerSubscription(unSubscribeDeck);
      const unSubscribeCard = firestore.event.subscribeCard({
        uid,
        updatedAt,
        onCange: (event) => {
          process.env.NODE_ENV !== "production" && console.log("SNAPSHOT CARD: ", event.metadata);
          void dispatch(cardOnChange(event));
        },
      });
      registerSubscription(unSubscribeCard);
    } catch (error) {
      stopSubscriptions();
      throw error;
    }
  };

export const loginGoogle = (): ThunkResult => async () => {
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
  publishAuthenticatedUser(result.user);
};
