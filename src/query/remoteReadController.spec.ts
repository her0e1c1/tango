import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyRealtimeChange } from "@/lib/realtimeChange";
import { firestoreKeys } from "@/query/firestoreKeys";
import {
  createRemoteReadController,
  type RemoteReadDependencies,
  type RemoteSubscriptionProps,
} from "@/query/remoteReadController";
import { createCard, createDeck } from "@/test/factories";

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
};

const byId = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((item) => [item.id, item]));

const createHarness = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const deckUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const cardUnsubscribes: ReturnType<typeof vi.fn>[] = [];
  const dependencies: RemoteReadDependencies = {
    client,
    readDecks: vi.fn(async () => []),
    readCards: vi.fn(async () => []),
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
    mirrorDecks: vi.fn(),
    mirrorCards: vi.fn(),
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

  it("loads both collections before attaching exactly one listener for each", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a", localMode: false });
    const card = createCard({ id: "card-a", deckId: deck.id });
    vi.mocked(harness.dependencies.readDecks).mockResolvedValue([deck]);
    vi.mocked(harness.dependencies.readCards).mockResolvedValue([card]);

    const first = harness.controller.start("uid-a");
    const strictModeReplay = harness.controller.start("uid-a");
    await Promise.all([first, strictModeReplay]);

    expect(harness.dependencies.readDecks).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.readCards).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.subscribeCards).toHaveBeenCalledTimes(1);
    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([deck]));
    expect(harness.client.getQueryData(firestoreKeys.cards("uid-a"))).toEqual(byId([card]));
    expect(harness.dependencies.mirrorDecks).toHaveBeenLastCalledWith([deck]);
    expect(harness.dependencies.mirrorCards).toHaveBeenLastCalledWith([card]);
    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready" });
  });

  it("applies replacement and delta snapshots to Query and the Redux mirror together", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a", localMode: false });
    vi.mocked(harness.dependencies.readDecks).mockResolvedValue([deck]);
    await harness.controller.start("uid-a");
    vi.mocked(harness.dependencies.mirrorDecks).mockClear();

    harness.deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [],
      metadata: { size: 0, fromLocal: false },
    });

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual({});
    expect(harness.dependencies.mirrorDecks).toHaveBeenLastCalledWith([]);

    const added = createDeck({ id: "deck-added", localMode: false });
    harness.deckSubscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [added], modified: [], removed: [] },
      metadata: { size: 1, fromLocal: false },
    });

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([added]));
    expect(harness.dependencies.mirrorDecks).toHaveBeenLastCalledWith([added]);
  });

  it("forces one refetch and reconnect, then retains data on a terminal listener error", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck-a", localMode: false });
    vi.mocked(harness.dependencies.readDecks).mockResolvedValue([deck]);
    await harness.controller.start("uid-a");

    harness.deckSubscriptions[0]?.onError(new Error("first listener failure"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2));
    expect(harness.dependencies.readDecks).toHaveBeenCalledTimes(2);
    expect(harness.deckUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(harness.cardUnsubscribes[0]).toHaveBeenCalledTimes(1);

    const terminalError = new Error("terminal listener failure");
    harness.deckSubscriptions[1]?.onError(terminalError);
    await vi.waitFor(() =>
      expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "error", error: terminalError })
    );

    expect(harness.dependencies.readDecks).toHaveBeenCalledTimes(2);
    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toEqual(byId([deck]));
  });

  it("manually retries a terminal error and grants the new connection one automatic recovery", async () => {
    const harness = createHarness();
    await harness.controller.start("uid-a");
    harness.deckSubscriptions[0]?.onError(new Error("automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(2));
    harness.deckSubscriptions[1]?.onError(new Error("terminal"));
    await vi.waitFor(() => expect(harness.controller.getSnapshot().status).toBe("error"));

    await harness.controller.retry();

    expect(harness.controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready" });
    expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(3);
    harness.deckSubscriptions[2]?.onError(new Error("new automatic recovery"));
    await vi.waitFor(() => expect(harness.dependencies.subscribeDecks).toHaveBeenCalledTimes(4));
  });

  it("prevents delayed work for an old UID from mutating Query, mirrors, or listeners", async () => {
    const harness = createHarness();
    const decksA = deferred<Deck[]>();
    const cardsA = deferred<Card[]>();
    const deckB = createDeck({ id: "deck-b", uid: "uid-b", localMode: false });
    const cardB = createCard({ id: "card-b", uid: "uid-b", deckId: deckB.id });
    vi.mocked(harness.dependencies.readDecks).mockImplementation((uid) =>
      uid === "uid-a" ? decksA.promise : Promise.resolve([deckB])
    );
    vi.mocked(harness.dependencies.readCards).mockImplementation((uid) =>
      uid === "uid-a" ? cardsA.promise : Promise.resolve([cardB])
    );

    const startA = harness.controller.start("uid-a");
    await harness.controller.start("uid-b");
    decksA.resolve([createDeck({ id: "deck-a", uid: "uid-a", localMode: false })]);
    cardsA.resolve([createCard({ id: "card-a", uid: "uid-a" })]);
    await startA;

    expect(harness.client.getQueryData(firestoreKeys.decks("uid-a"))).toBeUndefined();
    expect(harness.client.getQueryData(firestoreKeys.cards("uid-a"))).toBeUndefined();
    expect(harness.dependencies.subscribeDecks).not.toHaveBeenCalledWith(expect.objectContaining({ uid: "uid-a" }));
    expect(harness.dependencies.subscribeCards).not.toHaveBeenCalledWith(expect.objectContaining({ uid: "uid-a" }));
    expect(harness.dependencies.mirrorDecks).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.mirrorDecks).toHaveBeenLastCalledWith([deckB]);
    expect(harness.dependencies.mirrorCards).toHaveBeenCalledTimes(1);
    expect(harness.dependencies.mirrorCards).toHaveBeenLastCalledWith([cardB]);
  });
});
