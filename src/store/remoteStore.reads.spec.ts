import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { RemoteSubscriptionProps } from "@/shared/api/remoteSnapshot";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FirestoreInitializationResult } from "@/shared/firebase/firestore-runtime";
import { createRemoteStore, type RemoteReadDependencies, type RemoteStoreState } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const synced = { size: 0, fromCache: false, hasPendingWrites: false };

const createHarness = (
  waitForInitialization: RemoteReadDependencies["waitForInitialization"] = vi.fn<
    RemoteReadDependencies["waitForInitialization"]
  >(async () => ({ status: "ready" }))
) => {
  const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const deckUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const cardUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const dependencies: RemoteReadDependencies = {
    waitForInitialization,
    subscribeDecks: vi.fn((props) => {
      deckSubscriptions.push(props);
      const unsubscribe = vi.fn();
      deckUnsubscribes.push(unsubscribe);
      return unsubscribe;
    }),
    subscribeCards: vi.fn((props) => {
      cardSubscriptions.push(props);
      const unsubscribe = vi.fn();
      cardUnsubscribes.push(unsubscribe);
      return unsubscribe;
    }),
  };
  return {
    dependencies,
    store: createRemoteStore(dependencies),
    deckSubscriptions,
    cardSubscriptions,
    deckUnsubscribes,
    cardUnsubscribes,
  };
};

const publishInitial = (harness: ReturnType<typeof createHarness>, decks: Deck[] = [], cards: Card[] = []) => {
  harness.deckSubscriptions.at(-1)?.onSnapshot({
    type: "replace",
    items: decks,
    metadata: { ...synced, size: decks.length },
  });
  harness.cardSubscriptions.at(-1)?.onSnapshot({
    type: "replace",
    items: cards,
    metadata: { ...synced, size: cards.length },
  });
};

describe("remote store reads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts idle with read lifecycle actions", () => {
    const { store } = createHarness();

    expect(store.getState()).toMatchObject({
      uid: null,
      status: "idle",
      decksById: {},
      cardsById: {},
      start: expect.any(Function),
      stop: expect.any(Function),
      retry: expect.any(Function),
    });
  });

  it("waits for both initial snapshots before becoming ready", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck" });
    const card = createCard({ id: "card", deckId: deck.id });

    await harness.store.getState().start("uid-a");

    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledOnce();
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "loading" });

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    expect(harness.store.getState().status).toBe("loading");

    harness.cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    expect(harness.store.getState()).toMatchObject({
      status: "ready",
      syncStatus: "cached",
      decksById: { [deck.id]: deck },
      cardsById: { [card.id]: card },
    });
  });

  it("derives pending, cached, and synced states from metadata", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    publishInitial(harness);
    expect(harness.store.getState().syncStatus).toBe("synced");

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { ...synced, hasPendingWrites: true },
    });
    expect(harness.store.getState().syncStatus).toBe("pending");

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { ...synced, fromCache: true },
    });
    expect(harness.store.getState().syncStatus).toBe("cached");

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: synced,
    });
    expect(harness.store.getState().syncStatus).toBe("synced");
  });

  it("stops listeners and ignores stale callbacks", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "current" });
    await harness.store.getState().start("uid-a");
    publishInitial(harness, [deck]);
    const staleDeckSubscription = harness.deckSubscriptions[0];
    let decksDuringCleanup: RemoteStoreState["decksById"] | undefined;
    harness.deckUnsubscribes[0]?.mockImplementation(() => {
      staleDeckSubscription?.onSnapshot({
        type: "replace",
        items: [createDeck({ id: "stale-during-cleanup" })],
        metadata: synced,
      });
      decksDuringCleanup = harness.store.getState().decksById;
    });

    harness.store.getState().stop("uid-a");
    harness.store.getState().stop("uid-a");

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledOnce();
    expect(decksDuringCleanup).toEqual({ [deck.id]: deck });
    expect(harness.store.getState()).toMatchObject({
      uid: null,
      status: "idle",
      decksById: {},
      cardsById: {},
    });

    staleDeckSubscription?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "stale" })],
      metadata: synced,
    });
    expect(harness.store.getState().decksById).toEqual({});
  });

  it("keeps data when retrying the same user and clears it for another user", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck" });
    await harness.store.getState().start("uid-a");
    publishInitial(harness, [deck]);
    const staleDeckSubscription = harness.deckSubscriptions[0];

    harness.cardSubscriptions[0]?.onError(new Error("listener failed"));
    staleDeckSubscription?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "stale" })],
      metadata: synced,
    });

    expect(harness.store.getState()).toMatchObject({
      uid: "uid-a",
      status: "error",
      decksById: { [deck.id]: deck },
    });
    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledOnce();

    const retry = harness.store.getState().retry();
    expect(harness.store.getState()).toMatchObject({
      uid: "uid-a",
      status: "loading",
      decksById: { [deck.id]: deck },
    });
    await retry;

    await harness.store.getState().start("uid-b");
    expect(harness.store.getState()).toMatchObject({
      uid: "uid-b",
      status: "loading",
      decksById: {},
      cardsById: {},
    });
  });

  it("publishes initialization and listener failures without automatic recovery", async () => {
    const initializationFailure = new Error("initialization failed");
    const rejected = createHarness(vi.fn().mockRejectedValue(initializationFailure));
    await expect(rejected.store.getState().start("uid-a")).rejects.toBe(initializationFailure);
    expect(rejected.store.getState()).toMatchObject({
      status: "error",
      error: initializationFailure,
    });

    const listenerFailure = new Error("listener failed");
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    harness.cardSubscriptions[0]?.onError(listenerFailure);
    expect(harness.store.getState()).toMatchObject({ status: "error", error: listenerFailure });
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledOnce();
  });

  it("publishes blocked initialization and retries the same user", async () => {
    const error = new Error("persistence blocked");
    const waitForInitialization = vi
      .fn<RemoteReadDependencies["waitForInitialization"]>()
      .mockResolvedValueOnce({ status: "blocked", error })
      .mockResolvedValue({ status: "ready" });
    const harness = createHarness(waitForInitialization);

    await harness.store.getState().start("uid-a");

    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "blocked", error });
    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalled();
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalled();

    await harness.store.getState().retry();

    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ uid: "uid-a" })
    );
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ uid: "uid-a" })
    );
  });

  it.each(["blocked", "error"] as const)("resets %s state only when the stop UID matches", async (status) => {
    const error = new Error(`${status} read`);
    const harness =
      status === "blocked"
        ? createHarness(vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status, error })))
        : createHarness();

    await harness.store.getState().start("uid-a");
    if (status === "error") harness.cardSubscriptions[0]?.onError(error);

    const failedState = harness.store.getState();
    expect(failedState).toMatchObject({ uid: "uid-a", status, error });

    harness.store.getState().stop("uid-b");
    expect(harness.store.getState()).toBe(failedState);

    harness.store.getState().stop("uid-a");
    expect(harness.store.getState()).toMatchObject({
      uid: null,
      status: "idle",
      decksById: {},
      cardsById: {},
      syncStatus: undefined,
      error: undefined,
    });
  });

  it("does not create listeners when stopped during initialization", async () => {
    let resolveInitialization!: (result: FirestoreInitializationResult) => void;
    const initialization = new Promise<FirestoreInitializationResult>((resolve) => {
      resolveInitialization = resolve;
    });
    const harness = createHarness(vi.fn(() => initialization));

    const start = harness.store.getState().start("uid-a");
    harness.store.getState().stop("uid-a");
    resolveInitialization({ status: "ready" });
    await start;

    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalled();
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalled();
    expect(harness.store.getState()).toMatchObject({ uid: null, status: "idle" });
  });

  it("closes a partial subscription when listener setup throws", async () => {
    const harness = createHarness();
    const failure = new Error("card listener setup failed");
    vi.mocked(harness.dependencies.subscribeCards).mockImplementationOnce(() => {
      throw failure;
    });

    await expect(harness.store.getState().start("uid-a")).rejects.toBe(failure);
    expect(harness.store.getState()).toMatchObject({ status: "error", error: failure });

    harness.store.getState().stop("uid-a");

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledOnce();
  });

  it.each(["deck", "card"] as const)(
    "cleans a subscription when superseded during %s listener setup",
    async (listener) => {
      const harness = createHarness();
      const staleUnsubscribe = vi.fn();
      let latestStart: Promise<void> | undefined;
      const supersede = () => {
        latestStart = harness.store.getState().start("uid-b");
        return staleUnsubscribe;
      };
      if (listener === "deck") {
        vi.mocked(harness.dependencies.subscribeDecks).mockImplementationOnce(supersede);
      } else {
        vi.mocked(harness.dependencies.subscribeCards).mockImplementationOnce(supersede);
      }

      await harness.store.getState().start("uid-a");
      await latestStart;

      expect(staleUnsubscribe).toHaveBeenCalledOnce();
      expect(harness.dependencies.subscribeDecks).toHaveBeenLastCalledWith(expect.objectContaining({ uid: "uid-b" }));
      expect(harness.dependencies.subscribeCards).toHaveBeenLastCalledWith(expect.objectContaining({ uid: "uid-b" }));

      harness.store.getState().stop("uid-b");

      expect(staleUnsubscribe).toHaveBeenCalledOnce();
    }
  );

  it("lets the latest start own subscriptions", async () => {
    let resolveInitialization!: (result: FirestoreInitializationResult) => void;
    const initialization = new Promise<FirestoreInitializationResult>((resolve) => {
      resolveInitialization = resolve;
    });
    const harness = createHarness(vi.fn(() => initialization));

    const stale = harness.store.getState().start("uid-a");
    const current = harness.store.getState().start("uid-b");
    resolveInitialization({ status: "ready" });
    await Promise.all([stale, current]);

    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ uid: "uid-b" })
    );
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ uid: "uid-b" })
    );
  });
});
