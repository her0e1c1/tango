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

interface AuthLifecycle {
  active: boolean;
  generation: number;
  subscription: ({ uid: string } & ReturnType<typeof startFirestoreSubscriptions>) | undefined;
  bootstrap: Promise<unknown> | undefined;
}

const isCurrent = (state: AuthLifecycle, value: number) => state.active && value === state.generation;

function stopSubscriptions(state: AuthLifecycle) {
  state.subscription?.stop();
  state.subscription = undefined;
}

async function prepareAuthChange(state: AuthLifecycle, nextUser: User | null) {
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
  state.generation += 1;
  stopSubscriptions(state);
  replaceAuthSession({ status: "initializing" });
}

async function bootstrapAnonymousSession(state: AuthLifecycle): Promise<void> {
  stopSubscriptions(state);
  replaceAuthSession({ status: "authenticating", attemptId: Symbol("anonymous-auth") });
  state.bootstrap ??= signInAnonymously(auth).finally(() => {
    state.bootstrap = undefined;
  });
  await state.bootstrap;
}

async function restoreUserSession(state: AuthLifecycle, user: User, generation: number): Promise<void> {
  if (state.subscription?.uid !== user.uid) {
    stopSubscriptions(state);
    state.subscription = { uid: user.uid, ...startFirestoreSubscriptions(user.uid) };
  }
  await state.subscription.ready;
  if (!isCurrent(state, generation)) return;
  replaceAuthSession(authSessionFromUser(user));
}

async function activate(state: AuthLifecycle, user: User | null): Promise<void> {
  state.generation += 1;
  const generation = state.generation;
  try {
    await initialNetworkStopped;
    if (!isCurrent(state, generation)) return;
    await (user && !user.isAnonymous ? enableNetwork(db) : disableNetwork(db));
    if (!isCurrent(state, generation)) return;
    if (user === null) {
      await bootstrapAnonymousSession(state);
      return;
    }
    await restoreUserSession(state, user, generation);
  } catch (error) {
    if (isCurrent(state, generation)) replaceAuthSession({ status: "error", error });
  }
}

export function startAuthSession(): () => void {
  const state: AuthLifecycle = { active: true, generation: 0, subscription: undefined, bootstrap: undefined };
  const stopBefore = beforeAuthStateChanged(
    auth,
    (nextUser) => prepareAuthChange(state, nextUser),
    () => {
      // A later Firebase blocking callback may abort the change; restore the still-current identity.
      const user = auth.currentUser;
      if (user) void activate(state, user);
    }
  );
  const stopAuth = onIdTokenChanged(
    auth,
    (user) => {
      void activate(state, user);
    },
    (error) => {
      if (state.active) replaceAuthSession({ status: "error", error });
    }
  );
  return () => {
    state.active = false;
    state.generation += 1;
    stopAuth();
    stopBefore();
    stopSubscriptions(state);
    if (getAuthSession().status !== "error") replaceAuthSession({ status: "initializing" });
  };
}
