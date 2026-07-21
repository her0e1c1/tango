import { describe, expect, it, vi } from "vitest";

import { applyRealtimeChange } from "@/lib/realtimeChange";
import { createRemoteStore, type RemoteReadDependencies, type RemoteSubscriptionProps } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

const createHarness = () => {
  const deckSubscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const cardSubscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const dependencies: RemoteReadDependencies = {
    waitForInitialization: vi.fn<RemoteReadDependencies["waitForInitialization"]>(async () => ({ status: "ready" })),
    subscribeDecks: vi.fn((props) => {
      deckSubscriptions.push(props);
      return vi.fn();
    }),
    subscribeCards: vi.fn((props) => {
      cardSubscriptions.push(props);
      return vi.fn();
    }),
    applyChange: applyRealtimeChange,
  };
  return { store: createRemoteStore(dependencies), deckSubscriptions, cardSubscriptions };
};

describe("remote store snapshots", () => {
  it("publishes each collection atomically and becomes ready after both initial snapshots", async () => {
    const { store, deckSubscriptions, cardSubscriptions } = createHarness();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });
    const idle = store.getState().read;

    expect(store.getState().read).toBe(idle);
    await store.getState().start("uid-a");
    expect(store.getState().read).toEqual({ uid: "uid-a", status: "loading", decksById: {}, cardsById: {} });

    deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    expect(store.getState().read).toEqual({
      uid: "uid-a",
      status: "loading",
      decksById: { [deck.id]: deck },
      cardsById: {},
    });

    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getState().read).toEqual({
      uid: "uid-a",
      status: "ready",
      syncStatus: "cached",
      decksById: { [deck.id]: deck },
      cardsById: { [card.id]: card },
    });
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    deckSubscriptions[0]?.onError(new Error("after unsubscribe"));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("copies metadata before deriving status", async () => {
    const { store, deckSubscriptions, cardSubscriptions } = createHarness();
    const deckMetadata = { size: 0, fromCache: false, hasPendingWrites: false };
    await store.getState().start("uid-a");

    deckSubscriptions[0]?.onSnapshot({ type: "replace", items: [], metadata: deckMetadata });
    const afterDecks = store.getState().read;
    deckMetadata.hasPendingWrites = true;
    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [],
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });

    expect(store.getState().read).not.toBe(afterDecks);
    expect(store.getState().read).toMatchObject({ status: "ready", syncStatus: "synced" });
  });

  it("copies entity values and nested mutable data before publishing them", async () => {
    const { store, deckSubscriptions, cardSubscriptions } = createHarness();
    const deck = createDeck({ id: "deck-a", name: "Original", selectedTags: ["deck-tag"] });
    const nextSeeingAt = new Date(100);
    const card = createCard({
      id: "card-a",
      deckId: deck.id,
      frontText: "Original",
      tags: ["card-tag"],
      nextSeeingAt,
    });
    await store.getState().start("uid-a");
    deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const snapshot = store.getState().read;

    deck.name = "Changed";
    deck.selectedTags.push("changed");
    card.frontText = "Changed";
    card.tags.push("changed");
    nextSeeingAt.setTime(200);

    expect(store.getState().read).toBe(snapshot);
    expect(snapshot.decksById[deck.id]).toMatchObject({ name: "Original", selectedTags: ["deck-tag"] });
    expect(snapshot.cardsById[card.id]).toMatchObject({ frontText: "Original", tags: ["card-tag"] });
    expect(snapshot.cardsById[card.id]?.nextSeeingAt?.getTime()).toBe(100);
  });

  it("freezes published state, entities, nested arrays, maps, and Date values", async () => {
    const { store, deckSubscriptions, cardSubscriptions } = createHarness();
    const deck = createDeck({ id: "deck-a", selectedTags: ["deck-tag"] });
    const card = createCard({ id: "card-a", deckId: deck.id, tags: ["card-tag"], nextSeeingAt: new Date(100) });
    await store.getState().start("uid-a");
    deckSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    cardSubscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const snapshot = store.getState().read;
    const publishedDeck = snapshot.decksById[deck.id];
    const publishedCard = snapshot.cardsById[card.id];
    if (publishedDeck == null || publishedCard == null) throw new Error("Expected published entities");

    expect(Reflect.set(snapshot, "status", "idle")).toBe(false);
    expect(Reflect.set(snapshot.decksById, "other", deck)).toBe(false);
    expect(Reflect.set(publishedDeck, "name", "Changed")).toBe(false);
    expect(() => publishedDeck.selectedTags.push("changed")).toThrow();
    expect(Reflect.set(publishedCard, "frontText", "Changed")).toBe(false);
    expect(() => publishedCard.tags.push("changed")).toThrow();
    expect(() => publishedCard.nextSeeingAt?.setTime(200)).toThrow();
    expect(publishedCard.nextSeeingAt).toBeInstanceOf(Date);
    expect(publishedCard.nextSeeingAt?.getTime()).toBe(100);
    expect(store.getState().read).toBe(snapshot);
  });
});
