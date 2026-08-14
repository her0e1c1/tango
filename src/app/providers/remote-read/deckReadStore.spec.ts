import type { Deck } from "@/entities/deck";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { clearDecks, useDecks } from "@/entities/deck";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  subscriptions: [] as RemoteSubscriptionProps<Deck>[],
  unsubscribes: [] as ReturnType<typeof vi.fn>[],
}));

vi.mock("./subscribeDeckReads", () => ({
  subscribeDeckReads: vi.fn((props: RemoteSubscriptionProps<Deck>) => {
    mocks.subscriptions.push(props);
    const unsubscribe = vi.fn();
    mocks.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }),
}));

import { deckRemoteReadStore, startDeckReads, stopDeckReads } from "./deckReadStore";

describe("Deck remote read lifecycle", () => {
  beforeEach(() => {
    stopDeckReads();
    clearDecks();
    mocks.subscriptions = [];
    mocks.unsubscribes = [];
    vi.clearAllMocks();
  });

  it("publishes each realtime snapshot to the entity store", () => {
    const oldDeck = createDeck({ id: "old" });
    const currentDeck = createDeck({ id: "current", name: "Current" });
    startDeckReads("uid-a");
    const { result } = renderHook(useDecks);

    act(() => mocks.subscriptions[0]?.onSnapshot({ itemsById: { old: oldDeck }, syncStatus: "cached" }));
    expect(result.current).toEqual([oldDeck]);

    act(() => mocks.subscriptions[0]?.onSnapshot({ itemsById: { current: currentDeck }, syncStatus: "synced" }));
    expect(result.current).toEqual([currentDeck]);
    expect(deckRemoteReadStore.getState()).toMatchObject({
      status: "ready",
      syncStatus: "synced",
      itemsById: {},
    });
  });

  it("clears Deck data on stop and ignores stale snapshots", () => {
    const deck = createDeck({ id: "deck" });
    startDeckReads("uid-a");
    const { result } = renderHook(useDecks);
    const staleSubscription = mocks.subscriptions[0];
    staleSubscription?.onSnapshot({ itemsById: { deck }, syncStatus: "synced" });

    act(() => stopDeckReads("uid-a"));
    act(() =>
      staleSubscription?.onSnapshot({ itemsById: { stale: createDeck({ id: "stale" }) }, syncStatus: "synced" })
    );

    expect(mocks.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(result.current).toEqual([]);
    expect(deckRemoteReadStore.getState()).toMatchObject({ uid: null, status: "idle" });
  });

  it("clears the previous UID data before subscribing for another user", () => {
    startDeckReads("uid-a");
    const { result } = renderHook(useDecks);
    mocks.subscriptions[0]?.onSnapshot({
      itemsById: { previous: createDeck({ id: "previous", uid: "uid-a" }) },
      syncStatus: "synced",
    });

    act(() => startDeckReads("uid-b"));

    expect(result.current).toEqual([]);
    expect(deckRemoteReadStore.getState()).toMatchObject({ uid: "uid-b", status: "loading" });
  });
});
