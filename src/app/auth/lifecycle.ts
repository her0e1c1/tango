import { beforeAuthStateChanged, onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";
import { collection, disableNetwork, enableNetwork, getDocsFromCache, query, where } from "firebase/firestore";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { auth, db } from "@/shared/firebase";
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
  return snapshots.some((snapshot) => snapshot.metadata.hasPendingWrites);
}

export function startAuthSession(): () => void {
  let active = true;
  let generation = 0;
  const isCurrent = (value: number) => active && value === generation;
  let subscription: ({ uid: string } & ReturnType<typeof startFirestoreSubscriptions>) | undefined;
  let bootstrap: Promise<unknown> | undefined;
  const stopSubscriptions = () => {
    subscription?.stop();
    subscription = undefined;
  };
  const reportError = (error: unknown) => {
    if (active) replaceAuthSession({ status: "error", error });
  };
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
      if (user) void activate(user);
    }
  );

  async function bootstrapAnonymousSession(): Promise<void> {
    stopSubscriptions();
    replaceAuthSession({ status: "authenticating", attemptId: Symbol("anonymous-auth") });
    bootstrap ??= signInAnonymously(auth).finally(() => {
      bootstrap = undefined;
    });
    await bootstrap;
  }

  async function restoreUserSession(user: User, currentGeneration: number): Promise<void> {
    if (subscription?.uid !== user.uid) {
      stopSubscriptions();
      subscription = { uid: user.uid, ...startFirestoreSubscriptions(user.uid) };
    }
    await subscription.ready;
    if (!isCurrent(currentGeneration)) return;
    replaceAuthSession(authSessionFromUser(user));
  }

  async function activate(user: User | null): Promise<void> {
    generation += 1;
    const currentGeneration = generation;
    try {
      await initialNetworkStopped;
      if (!isCurrent(currentGeneration)) return;
      await (user && !user.isAnonymous ? enableNetwork(db) : disableNetwork(db));
      if (!isCurrent(currentGeneration)) return;
      if (user === null) {
        await bootstrapAnonymousSession();
        return;
      }
      await restoreUserSession(user, currentGeneration);
    } catch (error) {
      if (isCurrent(currentGeneration)) reportError(error);
    }
  }

  const stopAuth = onIdTokenChanged(
    auth,
    (user) => {
      void activate(user);
    },
    reportError
  );
  return () => {
    active = false;
    generation += 1;
    stopAuth();
    stopBefore();
    stopSubscriptions();
    if (getAuthSession().status !== "error") replaceAuthSession({ status: "initializing" });
  };
}
