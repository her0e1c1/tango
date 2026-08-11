import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FirestoreInitializationResult } from "@/shared/firebase/firestore-runtime";
import type { RemoteSubscriptionProps } from "@/domain/remoteSnapshot";
import { createRemoteStore, type RemoteReadDependencies } from "@/store/remoteStore";
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
    await harness.store.getState().start("uid-a");
    const staleDeckSubscription = harness.deckSubscriptions[0];

    harness.store.getState().stop("uid-a");

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledOnce();
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

  it("publishes blocked initialization", async () => {
    const error = new Error("persistence blocked");
    const harness = createHarness(
      vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status: "blocked", error }))
    );

    await harness.store.getState().start("uid-a");

    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "blocked", error });
    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalled();
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalled();
  });

  it("closes a partial subscription when listener setup throws", async () => {
    const harness = createHarness();
    const failure = new Error("card listener setup failed");
    vi.mocked(harness.dependencies.subscribeCards).mockImplementationOnce(() => {
      throw failure;
    });

    await expect(harness.store.getState().start("uid-a")).rejects.toBe(failure);

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ status: "error", error: failure });
  });

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
