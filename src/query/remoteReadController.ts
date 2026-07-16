import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { RemoteSnapshot } from "@/action/firestore/event";
import { firestoreKeys } from "@/query/firestoreKeys";

export type RemoteById<T> = Record<string, T | undefined>;

export interface RemoteSubscriptionProps<T> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}

export type RemoteReadState =
  | { uid: null; status: "idle" }
  | { uid: string; status: "loading" | "ready" }
  | { uid: string; status: "error"; error: Error };

export interface RemoteReadDependencies {
  client: QueryClient;
  readDecks: (uid: string) => Promise<Deck[]>;
  readCards: (uid: string) => Promise<Card[]>;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  mirrorDecks: (decks: Deck[]) => void;
  mirrorCards: (cards: Card[]) => void;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

const toById = <T extends { id: string }>(items: T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

const toItems = <T>(items: RemoteById<T>): T[] => Object.values(items).filter((item): item is T => item != null);

export const createRemoteReadController = (dependencies: RemoteReadDependencies) => {
  let activeUid: string | undefined;
  let generation = 0;
  let automaticRecoveries = 0;
  let recovering = false;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;
  let state: RemoteReadState = { uid: null, status: "idle" };
  const listeners = new Set<Callback>();

  const setState = (next: RemoteReadState) => {
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

  const stopListeners = () => {
    const subscriptions = [unsubscribeDeck, unsubscribeCard];
    unsubscribeDeck = undefined;
    unsubscribeCard = undefined;
    subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe?.();
      } catch {
        // A failing unsubscribe must not leave the other listener active.
      }
    });
  };

  const setCollection = <T extends { id: string }>(queryKey: QueryKey, items: T[], mirror: (items: T[]) => void) => {
    dependencies.client.setQueryData<RemoteById<T>>(queryKey, toById(items));
    mirror(items);
  };

  const applySnapshot = <T extends { id: string }>(
    uid: string,
    currentGeneration: number,
    queryKey: QueryKey,
    snapshot: RemoteSnapshot<T>,
    mirror: (items: T[]) => void
  ) => {
    if (!isCurrent(uid, currentGeneration)) return;
    const previous = dependencies.client.getQueryData<RemoteById<T>>(queryKey) ?? {};
    const next =
      snapshot.type === "replace" ? toById(snapshot.items) : dependencies.applyChange(previous, snapshot.event);
    dependencies.client.setQueryData(queryKey, next);
    mirror(toItems(next));
  };

  const handleListenerError = async (uid: string, currentGeneration: number, error: Error) => {
    if (!isCurrent(uid, currentGeneration) || recovering) return;
    stopListeners();
    if (automaticRecoveries >= 1) {
      setState({ uid, status: "error", error });
      return;
    }

    automaticRecoveries += 1;
    recovering = true;
    setState({ uid, status: "loading" });
    try {
      await loadAndSubscribe(uid, currentGeneration);
    } catch (recoveryError) {
      if (isCurrent(uid, currentGeneration)) {
        setState({
          uid,
          status: "error",
          error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        });
      }
    } finally {
      recovering = false;
    }
  };

  const attachListeners = (uid: string, currentGeneration: number) => {
    const onError = (error: Error) => {
      void handleListenerError(uid, currentGeneration, error);
    };
    const nextDeckSubscription = dependencies.subscribeDecks({
      uid,
      onSnapshot: (snapshot) =>
        applySnapshot(uid, currentGeneration, firestoreKeys.decks(uid), snapshot, dependencies.mirrorDecks),
      onError,
    });
    if (!isCurrent(uid, currentGeneration)) {
      nextDeckSubscription();
      return;
    }
    unsubscribeDeck = nextDeckSubscription;

    const nextCardSubscription = dependencies.subscribeCards({
      uid,
      onSnapshot: (snapshot) =>
        applySnapshot(uid, currentGeneration, firestoreKeys.cards(uid), snapshot, dependencies.mirrorCards),
      onError,
    });
    if (!isCurrent(uid, currentGeneration)) {
      nextCardSubscription();
      stopListeners();
      return;
    }
    unsubscribeCard = nextCardSubscription;
  };

  async function loadAndSubscribe(uid: string, currentGeneration: number) {
    const [decks, cards] = await Promise.all([dependencies.readDecks(uid), dependencies.readCards(uid)]);
    if (!isCurrent(uid, currentGeneration)) return;

    setCollection(firestoreKeys.decks(uid), decks, dependencies.mirrorDecks);
    setCollection(firestoreKeys.cards(uid), cards, dependencies.mirrorCards);
    attachListeners(uid, currentGeneration);
    if (isCurrent(uid, currentGeneration)) setState({ uid, status: "ready" });
  }

  const begin = (uid: string, resetAutomaticRecoveries: boolean) => {
    stopListeners();
    activeUid = uid;
    const currentGeneration = ++generation;
    recovering = false;
    if (resetAutomaticRecoveries) automaticRecoveries = 0;
    setState({ uid, status: "loading" });

    const operation = loadAndSubscribe(uid, currentGeneration).catch((error) => {
      if (isCurrent(uid, currentGeneration)) {
        setState({ uid, status: "error", error: error instanceof Error ? error : new Error(String(error)) });
      }
      throw error;
    });
    currentStart = operation;
    return operation;
  };

  return {
    start: (uid: string) => {
      if (activeUid === uid && (state.status === "loading" || state.status === "ready")) {
        return currentStart ?? Promise.resolve();
      }
      return begin(uid, true);
    },
    retry: () => (activeUid ? begin(activeUid, true) : Promise.resolve()),
    stop: (uid?: string) => {
      if (uid && uid !== activeUid) return;
      stopListeners();
      activeUid = undefined;
      generation += 1;
      recovering = false;
      currentStart = undefined;
      setState({ uid: null, status: "idle" });
    },
    subscribe: (listener: Callback) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
  };
};
