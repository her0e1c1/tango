import { describe, expect, it, vi } from "vitest";

import { createRemoteStore } from "@/store/remoteStore";
import { createCard, createDeck } from "@/test/factories";

describe("remote store", () => {
  it("publishes each collection atomically and becomes ready after both initial snapshots", () => {
    const store = createRemoteStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });

    const idle = store.getSnapshot();
    expect(store.getSnapshot()).toBe(idle);

    store.begin("uid-a");
    const loading = store.getSnapshot();
    expect(loading).toEqual({ uid: "uid-a", status: "loading", decksById: {}, cardsById: {} });
    expect(store.getSnapshot()).toBe(loading);

    store.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: true, hasPendingWrites: false },
    });
    expect(store.getSnapshot()).toEqual({
      uid: "uid-a",
      status: "loading",
      decksById: { [deck.id]: deck },
      cardsById: {},
    });

    store.applySnapshot("uid-a", "cards", {
      data: { [card.id]: card },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getSnapshot()).toEqual({
      uid: "uid-a",
      status: "ready",
      syncStatus: "cached",
      decksById: { [deck.id]: deck },
      cardsById: { [card.id]: card },
    });
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    store.fail("uid-a", new Error("after unsubscribe"));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("aggregates metadata and notifies when only metadata changes", () => {
    const store = createRemoteStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.begin("uid-a");

    store.applySnapshot("uid-a", "decks", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    store.applySnapshot("uid-a", "cards", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(store.getSnapshot()).toMatchObject({ status: "ready", syncStatus: "synced" });

    const synced = store.getSnapshot();
    store.applySnapshot("uid-a", "decks", {
      data: synced.decksById,
      metadata: { size: 0, fromCache: true, hasPendingWrites: false },
    });
    expect(store.getSnapshot()).not.toBe(synced);
    expect(store.getSnapshot()).toMatchObject({ status: "ready", syncStatus: "cached" });

    store.applySnapshot("uid-a", "cards", {
      data: store.getSnapshot().cardsById,
      metadata: { size: 0, fromCache: false, hasPendingWrites: true },
    });
    expect(store.getSnapshot()).toMatchObject({ status: "ready", syncStatus: "pending" });
    expect(listener).toHaveBeenCalledTimes(5);
  });

  it("publishes a private metadata copy with the matching public state", () => {
    const store = createRemoteStore();
    const published: ReturnType<typeof store.getSnapshot>[] = [];
    const deckMetadata = { size: 0, fromCache: false, hasPendingWrites: false };
    store.subscribe(() => published.push(store.getSnapshot()));
    store.begin("uid-a");

    store.applySnapshot("uid-a", "decks", { data: {}, metadata: deckMetadata });
    const decksPublished = store.getSnapshot();
    deckMetadata.hasPendingWrites = true;
    store.applySnapshot("uid-a", "cards", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });

    expect(published.at(-2)).toBe(decksPublished);
    expect(published.at(-1)).toBe(store.getSnapshot());
    expect(store.getSnapshot()).toMatchObject({ status: "ready", syncStatus: "synced" });
  });

  it("retains data for a same-UID retry and clears it for a different UID", () => {
    const store = createRemoteStore();
    const deck = createDeck({ id: "deck-a" });
    store.begin("uid-a");
    store.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });

    store.begin("uid-a");
    expect(store.getSnapshot()).toEqual({
      uid: "uid-a",
      status: "loading",
      decksById: { [deck.id]: deck },
      cardsById: {},
    });

    store.begin("uid-b");
    expect(store.getSnapshot()).toEqual({ uid: "uid-b", status: "loading", decksById: {}, cardsById: {} });
  });

  it("retains data in an error and ignores updates for a different UID", () => {
    const store = createRemoteStore();
    const deck = createDeck({ id: "deck-a" });
    store.begin("uid-a");
    store.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const beforeStaleUpdates = store.getSnapshot();

    store.applySnapshot("uid-b", "cards", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    store.fail("uid-b", new Error("stale"));
    store.clear("uid-b");
    expect(store.getSnapshot()).toBe(beforeStaleUpdates);

    const error = new Error("listener failed");
    store.fail("uid-a", error);
    expect(store.getSnapshot()).toEqual({
      uid: "uid-a",
      status: "error",
      error,
      decksById: { [deck.id]: deck },
      cardsById: {},
    });

    store.clear("uid-a");
    expect(store.getSnapshot()).toEqual({ uid: null, status: "idle", decksById: {}, cardsById: {} });
  });

  it("reads and replaces an active collection without changing the other collection", () => {
    const store = createRemoteStore();
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-a", deckId: deck.id });
    store.begin("uid-a");

    expect(store).toMatchObject({ read: expect.any(Function), replace: expect.any(Function) });
    store.replace("uid-a", "decks", { [deck.id]: deck });
    store.replace("uid-a", "cards", { [card.id]: card });

    expect(store.read("uid-a", "decks")).toEqual({ [deck.id]: deck });
    expect(store.read("uid-a", "cards")).toEqual({ [card.id]: card });
    expect(store.getSnapshot()).toEqual({
      uid: "uid-a",
      status: "loading",
      decksById: { [deck.id]: deck },
      cardsById: { [card.id]: card },
    });

    const active = store.getSnapshot();
    store.replace("uid-b", "decks", {});
    expect(store.read("uid-b", "decks")).toEqual({});
    expect(store.getSnapshot()).toBe(active);
  });
});
