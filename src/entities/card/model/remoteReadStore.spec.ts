import { describe, expect, it, vi } from "vitest";

import type { Card } from "@/entities/card/model/card";
import type { RemoteSubscriptionProps } from "@/shared/api/remoteSnapshot";
import { createRemoteReadStore } from "@/shared/lib/remote-read/createRemoteReadStore";
import { createCard } from "@/test/factories";

const synced = { size: 0, fromCache: false, hasPendingWrites: false };

const createHarness = () => {
  const subscriptions: Array<RemoteSubscriptionProps<Card>> = [];
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const store = createRemoteReadStore<Card>({
    waitForInitialization: vi.fn(async () => ({ status: "ready" as const })),
    subscribe: vi.fn((props) => {
      subscriptions.push(props);
      const unsubscribe = vi.fn();
      unsubscribes.push(unsubscribe);
      return unsubscribe;
    }),
  });
  return { store, subscriptions, unsubscribes };
};

describe("Card remote read store", () => {
  it("becomes ready from the Card snapshot alone", async () => {
    const harness = createHarness();
    const card = createCard({ id: "card" });

    await harness.store.getState().start("uid-a");
    expect(harness.store.getState().status).toBe("loading");

    harness.subscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: { ...synced, size: 1 },
    });

    expect(harness.store.getState()).toMatchObject({
      status: "ready",
      syncStatus: "synced",
      itemsById: { [card.id]: card },
    });
  });

  it("ignores stale Card callbacks after stop", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    harness.store.getState().stop("uid-a");
    staleSubscription?.onSnapshot({
      type: "replace",
      items: [createCard({ id: "stale" })],
      metadata: synced,
    });

    expect(harness.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ status: "idle", itemsById: {} });
  });

  it("retains Card data on retry and clears it for a new UID", async () => {
    const harness = createHarness();
    const card = createCard({ id: "card" });
    await harness.store.getState().start("uid-a");
    harness.subscriptions[0]?.onSnapshot({
      type: "replace",
      items: [card],
      metadata: synced,
    });
    harness.subscriptions[0]?.onError(new Error("listener failed"));

    const retry = harness.store.getState().retry();
    expect(harness.store.getState().itemsById).toEqual({ [card.id]: card });
    await retry;

    await harness.store.getState().start("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-b", status: "loading", itemsById: {} });
  });
});
