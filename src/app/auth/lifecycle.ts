import { beforeAuthStateChanged, onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";
import { collection, disableNetwork, enableNetwork, getDocsFromCache, query, where } from "firebase/firestore";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { hasUnacknowledgedWrites, subscribeWriteErrors } from "@/shared/firestore-write";
import { auth, db } from "@/shared/firebase";
import { showToast } from "@/shared/ui/toast";
import { startFirestoreSubscriptions } from "../firestore-subscriptions";

// This is the first operation on the Firestore client, before any reads or restored writes can start networking.
const initialNetworkStopped = disableNetwork(db);
// Keep startup errors handled even before React installs the lifecycle.
void initialNetworkStopped.catch(() => undefined);

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

async function hasPendingChanges(uid: string): Promise<boolean> {
  const snapshots = await Promise.all(
    ["deck", "card", "studySession", "studyAnswer"].map((name) =>
      getDocsFromCache(query(collection(db, name), where("uid", "==", uid)))
    )
  );
  return hasUnacknowledgedWrites(uid) || snapshots.some((snapshot) => snapshot.metadata.hasPendingWrites);
}

export function startAuthSession(): () => void {
  let active = true;
  let generation = 0;
  const isCurrent = (value: number) => active && value === generation;
  let subscribedUid: string | undefined;
  let stopData: (() => void) | undefined;
  let dataReady = Promise.resolve();
  let bootstrap: Promise<unknown> | undefined;
  const stopSubscriptions = () => {
    stopData?.();
    stopData = undefined;
    subscribedUid = undefined;
    dataReady = Promise.resolve();
  };
  const reportError = (error: unknown) => {
    if (active) replaceAuthSession({ status: "error", error });
  };
  const stopErrors = subscribeWriteErrors(() => {
    if (active) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
  });
  const stopBefore = beforeAuthStateChanged(
    auth,
    async (nextUser) => {
      await initialNetworkStopped;
      const previous = auth.currentUser;
      if (previous?.uid === nextUser?.uid) return;
      if (previous && !previous.isAnonymous) {
        // Close editing before checking both this run's writes and writes restored from the SDK cache.
        replaceAuthSession({ status: "initializing" });
        try {
          if (await hasPendingChanges(previous.uid)) throw new Error("Sync changes before signing out");
        } catch (error) {
          replaceAuthSession(authSessionFromUser(previous));
          throw error;
        }
      }
      await disableNetwork(db);
      generation += 1;
      stopSubscriptions();
      replaceAuthSession({ status: "initializing" });
    },
    () => {
      // A later Firebase blocking callback may abort the change; restore the still-current identity.
      const user = auth.currentUser;
      if (user) activateSafely(user);
    }
  );

  async function activate(user: User | null): Promise<void> {
    generation += 1;
    const currentGeneration = generation;
    await initialNetworkStopped;
    if (!isCurrent(currentGeneration)) return;
    if (user === null) {
      await disableNetwork(db);
      stopSubscriptions();
      if (bootstrap !== undefined) return;
      replaceAuthSession({ status: "authenticating", attemptId: Symbol("anonymous-auth") });
      bootstrap = signInAnonymously(auth);
      void bootstrap
        .catch((error: unknown) => {
          if (currentGeneration === generation) reportError(error);
        })
        .finally(() => {
          bootstrap = undefined;
        });
      return;
    }
    await disableNetwork(db);
    if (!isCurrent(currentGeneration)) return;
    if (!user.isAnonymous) await enableNetwork(db);
    if (!isCurrent(currentGeneration)) return;
    if (subscribedUid !== user.uid) {
      stopSubscriptions();
      const subscription = startFirestoreSubscriptions(user.uid);
      stopData = subscription.stop;
      subscribedUid = user.uid;
      dataReady = subscription.ready;
    }
    await dataReady;
    if (!isCurrent(currentGeneration)) return;
    replaceAuthSession(authSessionFromUser(user));
  }

  function activateSafely(user: User | null): void {
    const activation = activate(user);
    const activationGeneration = generation;
    void activation.catch((error: unknown) => {
      if (isCurrent(activationGeneration)) reportError(error);
    });
  }

  const stopAuth = onIdTokenChanged(auth, activateSafely, reportError);
  return () => {
    active = false;
    generation += 1;
    stopAuth();
    stopBefore();
    stopErrors();
    stopSubscriptions();
    if (getAuthSession().status !== "error") replaceAuthSession({ status: "initializing" });
  };
}
