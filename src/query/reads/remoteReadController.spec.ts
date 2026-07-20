/**
 * @file Verifies the "remote read controller" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "attaches one listener per
 * collection and becomes ready from cached initial snapshots", "applies delta snapshots and
 * publishes pending then server-synced metadata", "forces one refetch and reconnect, then retains
 * data on a terminal listener error".
 */

import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyRealtimeChange } from "@/lib/realtimeChange";
import { firestoreKeys } from "@/query/cache/firestoreKeys";
import { createRemoteCache } from "@/query/cache/remoteCache";
import {
  createRemoteReadController,
  type RemoteReadDependencies,
  type RemoteSubscriptionProps,
} from "@/query/reads/remoteReadController";
import { createCard, createDeck } from "@/test/factories";

/**
 * Provides the by id test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((item) => [item.id, item]));

/**
 * Provides the create harness test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createHarness = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const deckUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const cardUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const dependencies: RemoteReadDependencies = {
    cache: createRemoteCache(client),
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
    client,
    dependencies,
    controller: createRemoteReadController(dependencies),
    deckSubscriptions,
    cardSubscriptions,
    deckUnsubscribes,
    cardUnsubscribes,
  };
};

describe("remote read controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("attaches one listener per collection and becomes ready from cached initial snapshots", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });

    const first = harness.controller.start("uid-a");
    const strictModeReplay = harness.controller.start("uid-a");
    await Promise.all([first, strictModeReplay]);

    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledTimes(1);
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "loading" });

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "loading" });
    harness.cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([deck]));
    expect(harness.client.getQueryData(firestoreKeys.cards("uid-a"))).toEqual(byId([card]));
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "cached" });
  });

  it("applies delta snapshots and publishes pending then server-synced metadata", async () => {
    const harness = createHarness();
    await harness.controller.start("uid-a");

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

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual({});
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "synced" });

    const added = createDeck({ id: "deck-added" });
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [added], modified: [], removed: [] },
      metadata: { size: 1, fromCache: true, hasPendingWrites: true },
    });

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([added]));
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "pending" });

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [], modified: [], removed: [] },
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "synced" });
  });

  it("forces one refetch and reconnect, then retains data on a terminal listener error", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    await harness.controller.start("uid-a");
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
      expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "error", error: terminalError })
    );

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([deck]));
  });

  it("manually retries a terminal error and grants the new connection one automatic recovery", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a" });
    await harness.controller.start("uid-a");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    harness.deckSubscriptions[0]?.onError(new Error("automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2));
    harness.deckSubscriptions[1]?.onError(new Error("terminal"));
    await vi.waitFor(() => expect(harness.controller.getSnapshot().status).toBe("error"));

    await harness.controller.retry();

    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "loading" });
    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([deck]));
    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(3);
    harness.deckSubscriptions[2]?.onError(new Error("new automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(4));
  });

  it("prevents snapshots from an old UID generation from mutating Query or sync state", async () => {
    const harness = createHarness();
    const deckB = createDeck({ id: "deck-b", uid: "uid-b" });
    const cardB = createCard({ id: "card-b", uid: "uid-b", deckId: deckB.id });

    await harness.controller.start("uid-a");
    await harness.controller.start("uid-b");
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "deck-a", uid: "uid-a" })],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    harness.cardSubscriptions[0]?.onError(new Error("stale listener"));
    harness.deckSubscriptions[1]?.onSnapshot({
      type: "replace",
      items: [deckB],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    harness.cardSubscriptions[1]?.onSnapshot({
      type: "replace",
      items: [cardB],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toBeUndefined();
    expect(harness.client.getQueryData(firestoreKeys.cards("uid-a"))).toBeUndefined();
    expect(harness.client.getQueryData(firestoreKeys.decks("uid-b"))).toEqual(byId([deckB]));
    expect(harness.client.getQueryData(firestoreKeys.cards("uid-b"))).toEqual(byId([cardB]));
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-b", status: "ready", syncStatus: "synced" });
  });
});
