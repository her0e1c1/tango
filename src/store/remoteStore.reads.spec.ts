import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyRealtimeChange } from "@/lib/realtimeChange";
import { createRemoteStore, type RemoteReadDependencies, type RemoteSubscriptionProps } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((item) => [item.id, item]));

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
    applyChange: applyRealtimeChange,
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

describe("remote store reads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exposes idle read state and lifecycle actions through Zustand", () => {
    const { store } = createHarness();

    expect(store.getState().read).toEqual({
      uid: null,
      status: "idle",
      decksById: {},
      cardsById: {},
    });
    expect(store.getState().start).toEqual(expect.any(Function));
    expect(store.getState().stop).toEqual(expect.any(Function));
    expect(store.getState().retryReads).toEqual(expect.any(Function));
  });

  it("attaches one listener per collection and becomes ready from cached initial snapshots", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });

    const first = harness.store.getState().start("uid-a");
    const strictModeReplay = harness.store.getState().start("uid-a");
    await Promise.all([first, strictModeReplay]);

    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledTimes(1);
    expect(harness.store.getState().read).toEqual({
      uid: "uid-a",
      status: "loading",
      decksById: {},
      cardsById: {},
    });

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    harness.cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });

    expect(harness.store.getState().read).toEqual({
      uid: "uid-a",
      status: "ready",
      syncStatus: "cached",
      decksById: byId([deck]),
      cardsById: byId([card]),
    });
  });

  it("applies changes and publishes pending, cached, and synced metadata-only updates", async () => {
    const harness = createHarness();
    const listener = vi.fn();
    harness.store.subscribe(listener);
    await harness.store.getState().start("uid-a");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [],
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    harness.cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [],
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(harness.store.getState().read).toMatchObject({ status: "ready", syncStatus: "synced" });

    const added = createDeck({ id: "deck-added" });
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [added], modified: [], removed: [] },
      metadata: { size: 1, fromCache: true, hasPendingWrites: true },
    });
    expect(harness.store.getState().read).toMatchObject({
      status: "ready",
      syncStatus: "pending",
      decksById: byId([added]),
    });

    const pending = harness.store.getState().read;
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { size: 0, fromCache: true, hasPendingWrites: false },
    });
    expect(harness.store.getState().read).not.toBe(pending);
    expect(harness.store.getState().read).toMatchObject({ status: "ready", syncStatus: "cached" });

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(harness.store.getState().read).toMatchObject({ status: "ready", syncStatus: "synced" });
    expect(listener).toHaveBeenCalledTimes(6);
  });

  it("recovers once, then retains data on a terminal listener error and ignores stale callbacks", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    await harness.store.getState().start("uid-a");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    harness.cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [],
      metadata: { size: 0, fromCache: true, hasPendingWrites: false },
    });

    harness.deckSubscriptions[0]?.onError(new Error("first listener failure"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2));
    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledTimes(1);

    const terminalError = new Error("terminal listener failure");
    harness.deckSubscriptions[1]?.onError(terminalError);
    await vi.waitFor(() =>
      expect(harness.store.getState().read).toMatchObject({ status: "error", error: terminalError })
    );
    const terminalRead = harness.store.getState().read;
    harness.deckSubscriptions[1]?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "stale" })],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    expect(harness.store.getState().read).toBe(terminalRead);
    expect(harness.store.getState().read.decksById).toEqual(byId([deck]));
  });

  it("keeps recovery listeners active when setup reports an error before returning", async () => {
    const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
    const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
    const deckUnsubscribes: ReturnType<typeof vi.fn>[] = [];
    const cardUnsubscribes: ReturnType<typeof vi.fn>[] = [];
    const dependencies: RemoteReadDependencies = {
      waitForInitialization: vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status: "ready" })),
      subscribeDecks: vi.fn((props) => {
        deckSubscriptions.push(props);
        const unsubscribe = vi.fn();
        deckUnsubscribes.push(unsubscribe);
        if (deckSubscriptions.length === 1) props.onError(new Error("synchronous listener failure"));
        return unsubscribe;
      }),
      subscribeCards: vi.fn((props) => {
        cardSubscriptions.push(props);
        const unsubscribe = vi.fn();
        cardUnsubscribes.push(unsubscribe);
        return unsubscribe;
      }),
      applyChange: applyRealtimeChange,
    };
    const store = createRemoteStore(dependencies);
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });

    await store.getState().start("uid-a");

    expect(deckSubscriptions).toHaveLength(2);
    expect(cardSubscriptions).toHaveLength(1);
    expect(deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(deckUnsubscribes[1]).not.toHaveBeenCalled();
    expect(cardUnsubscribes[0]).not.toHaveBeenCalled();

    deckSubscriptions[1]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getState().read).toEqual({
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: byId([deck]),
      cardsById: byId([card]),
    });

    store.getState().stop("uid-a");
    expect(deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(deckUnsubscribes[1]).toHaveBeenCalledTimes(1);
    expect(cardUnsubscribes[0]).toHaveBeenCalledTimes(1);
  });

  it("manual retry resets automatic recovery and retains same-UID data", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    await harness.store.getState().start("uid-a");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    harness.deckSubscriptions[0]?.onError(new Error("automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2));
    harness.deckSubscriptions[1]?.onError(new Error("terminal"));
    await vi.waitFor(() => expect(harness.store.getState().read.status).toBe("error"));

    await harness.store.getState().retryReads();

    expect(harness.store.getState().read).toMatchObject({
      uid: "uid-a",
      status: "loading",
      decksById: byId([deck]),
    });
    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(3);
    harness.deckSubscriptions[2]?.onError(new Error("new automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(4));
  });

  it("publishes and rejects a synchronous setup failure", async () => {
    const harness = createHarness();
    const initializationError = new Error("card listener setup failed");
    vi.mocked(harness.dependencies.subscribeCards).mockImplementationOnce(() => {
      throw initializationError;
    });

    await expect(harness.store.getState().start("uid-a")).rejects.toBe(initializationError);

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(harness.store.getState().read).toMatchObject({ uid: "uid-a", status: "error", error: initializationError });
    const failedRead = harness.store.getState().read;
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "stale" })],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(harness.store.getState().read).toBe(failedRead);
  });

  it("consumes a synchronous setup failure during automatic recovery", async () => {
    const harness = createHarness();
    const recoveryError = new Error("automatic recovery setup failed");
    const unhandledRejections: unknown[] = [];
    const recordUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason);
    process.on("unhandledRejection", recordUnhandledRejection);

    try {
      await harness.store.getState().start("uid-a");
      vi.mocked(harness.dependencies.subscribeDecks).mockImplementationOnce(() => {
        throw recoveryError;
      });
      harness.deckSubscriptions[0]?.onError(new Error("listener failed"));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(harness.store.getState().read).toMatchObject({ status: "error", error: recoveryError });
      expect(unhandledRejections).toEqual([]);
    } finally {
      process.off("unhandledRejection", recordUnhandledRejection);
    }
  });

  it("attempts both listener cleanups when one throws", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    harness.deckUnsubscribes[0]?.mockImplementation(() => {
      throw new Error("deck cleanup failed");
    });

    expect(() => harness.store.getState().stop("uid-a")).not.toThrow();

    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(harness.store.getState().read).toEqual({ uid: null, status: "idle", decksById: {}, cardsById: {} });
  });

  it("does not attach listeners when Firestore initialization is blocked", async () => {
    const error = new Error("another tab owns the cache");
    const harness = createHarness(
      vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status: "blocked", error }))
    );

    await harness.store.getState().start("uid-a");

    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalled();
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalled();
    expect(harness.store.getState().read.status).toBe("idle");
  });

  it("does not start a stopped initialization request", async () => {
    let finishInitialization: (state: { status: "ready" }) => void = () => undefined;
    const harness = createHarness(
      vi.fn<RemoteReadDependencies["waitForInitialization"]>(
        () =>
          new Promise<{ status: "ready" }>((resolve) => {
            finishInitialization = resolve;
          })
      )
    );

    const starting = harness.store.getState().start("uid-a");
    harness.store.getState().stop("uid-a");
    finishInitialization({ status: "ready" });
    await starting;

    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalled();
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalled();
  });

  it("ignores stale UID callbacks and clears data for the replacement UID", async () => {
    const harness = createHarness();
    const deckA = createDeck({ id: "deck-a", uid: "uid-a" });
    const deckB = createDeck({ id: "deck-b", uid: "uid-b" });
    await harness.store.getState().start("uid-a");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deckA],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    await harness.store.getState().start("uid-b");
    expect(harness.store.getState().read).toEqual({ uid: "uid-b", status: "loading", decksById: {}, cardsById: {} });
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deckA],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    harness.cardSubscriptions[0]?.onError(new Error("stale listener"));
    harness.deckSubscriptions[1]?.onSnapshot({
      type: "replace",
      items: [deckB],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    expect(harness.store.getState().read).toMatchObject({ uid: "uid-b", decksById: byId([deckB]) });
    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2);
  });
});
