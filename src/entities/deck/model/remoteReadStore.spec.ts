import { describe, expect, it, vi } from "vitest";

import type { Deck } from "@/entities/deck/model/deck";
import type { RemoteSubscriptionProps } from "@/shared/api";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { createDeck } from "@/test/factories";

const synced = { fromCache: false, hasPendingWrites: false };

const createHarness = () => {
  const subscriptions: Array<RemoteSubscriptionProps<Deck>> = [];
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const store = createRemoteReadStore<Deck>({
    waitForInitialization: vi.fn(async () => ({ status: "ready" as const })),
    subscribe: vi.fn((props) => {
      subscriptions.push(props);
      const unsubscribe = vi.fn();
      unsubscribes.push(unsubscribe);
      return unsubscribe;
    }),
    keyOf: (deck) => deck.id,
  });
  return { store, subscriptions, unsubscribes };
};

describe("Deck remote read store", () => {
  it("becomes ready from the Deck snapshot alone", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck" });

    await harness.store.getState().start("uid-a");
    expect(harness.store.getState().status).toBe("loading");

    harness.subscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: { ...synced, fromCache: true },
    });

    expect(harness.store.getState()).toMatchObject({
      status: "ready",
      syncStatus: "cached",
      itemsById: { [deck.id]: deck },
    });
  });

  it("ignores stale Deck callbacks after stop", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    harness.store.getState().stop("uid-a");
    staleSubscription?.onSnapshot({
      type: "replace",
      items: [createDeck({ id: "stale" })],
      metadata: synced,
    });

    expect(harness.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ status: "idle", itemsById: {} });
  });

  it("retains Deck data on retry and clears it for a new UID", async () => {
    const harness = createHarness();
    const deck = createDeck({ id: "deck" });
    await harness.store.getState().start("uid-a");
    harness.subscriptions[0]?.onSnapshot({
      type: "replace",
      items: [deck],
      metadata: synced,
    });
    harness.subscriptions[0]?.onError(new Error("listener failed"));

    const retry = harness.store.getState().retry();
    expect(harness.store.getState().itemsById).toEqual({ [deck.id]: deck });
    await retry;

    await harness.store.getState().start("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-b", status: "loading", itemsById: {} });
  });
});
