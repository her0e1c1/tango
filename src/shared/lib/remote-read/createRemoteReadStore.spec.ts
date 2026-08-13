import { beforeEach, describe, expect, it, vi } from "vitest";

import { toRemoteById, type RemoteSubscriptionProps, type RemoteSyncStatus } from "@/shared/api";
import { createRemoteReadStore, type RemoteReadDependencies } from "@/shared/lib/remote-read/createRemoteReadStore";

interface Item {
  id: string;
  value: string;
}

const createItem = (id: string, value = id): Item => ({ id, value });

const createHarness = () => {
  const subscriptions: Array<RemoteSubscriptionProps<Item>> = [];
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const dependencies: RemoteReadDependencies<Item> = {
    subscribe: vi.fn((props) => {
      subscriptions.push(props);
      const unsubscribe = vi.fn();
      unsubscribes.push(unsubscribe);
      return unsubscribe;
    }),
  };

  return {
    dependencies,
    store: createRemoteReadStore(dependencies),
    subscriptions,
    unsubscribes,
  };
};

const publish = (
  harness: ReturnType<typeof createHarness>,
  items: Item[] = [],
  syncStatus: RemoteSyncStatus = "synced"
) => {
  harness.subscriptions.at(-1)?.onSnapshot({ itemsById: toRemoteById(items), syncStatus });
};

describe("createRemoteReadStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts loading and becomes ready from a snapshot", () => {
    const harness = createHarness();
    const item = createItem("item");

    harness.store.getState().start("uid-a");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "loading", itemsById: {} });

    publish(harness, [item], "cached");
    expect(harness.store.getState()).toMatchObject({
      status: "ready",
      syncStatus: "cached",
      itemsById: { [item.id]: item },
    });
  });

  it("replaces the current items and sync status with every snapshot", () => {
    const harness = createHarness();
    harness.store.getState().start("uid-a");
    publish(harness, [createItem("old")], "pending");
    publish(harness, [createItem("current", "updated")], "synced");

    expect(harness.store.getState()).toMatchObject({
      itemsById: { current: createItem("current", "updated") },
      syncStatus: "synced",
    });
  });

  it("stops its listener and ignores stale callbacks", () => {
    const harness = createHarness();
    harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    harness.store.getState().stop("uid-a");
    staleSubscription?.onSnapshot({ itemsById: { stale: createItem("stale") }, syncStatus: "synced" });

    expect(harness.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ uid: null, status: "idle", itemsById: {} });
  });

  it("ignores snapshots from a previous UID", () => {
    const harness = createHarness();
    harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    harness.store.getState().start("uid-b");
    publish(harness, [createItem("current")]);
    staleSubscription?.onSnapshot({ itemsById: { stale: createItem("stale") }, syncStatus: "synced" });

    expect(harness.store.getState()).toMatchObject({ uid: "uid-b", itemsById: { current: createItem("current") } });
  });

  it("retains data for a same-UID retry and clears it for another UID", () => {
    const harness = createHarness();
    const item = createItem("item");
    harness.store.getState().start("uid-a");
    publish(harness, [item]);
    harness.subscriptions[0]?.onError(new Error("listener failed"));

    harness.store.getState().retry();
    expect(harness.store.getState()).toMatchObject({
      uid: "uid-a",
      status: "loading",
      itemsById: { [item.id]: item },
    });

    harness.store.getState().start("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-b", status: "loading", itemsById: {} });
  });

  it("publishes listener and setup failures", () => {
    const listener = createHarness();
    listener.store.getState().start("uid-a");
    const listenerFailure = new Error("listener failed");
    listener.subscriptions[0]?.onError(listenerFailure);

    expect(listener.store.getState()).toMatchObject({ status: "error", error: listenerFailure });
    expect(listener.unsubscribes[0]).toHaveBeenCalledOnce();

    const setup = createHarness();
    const setupFailure = new Error("listener setup failed");
    vi.mocked(setup.dependencies.subscribe).mockImplementationOnce(() => {
      throw setupFailure;
    });
    setup.store.getState().start("uid-a");
    expect(setup.store.getState()).toMatchObject({ status: "error", error: setupFailure });
  });

  it("stops only the matching UID", () => {
    const harness = createHarness();
    harness.store.getState().start("uid-a");
    harness.store.getState().stop("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "loading" });

    harness.store.getState().stop("uid-a");
    expect(harness.store.getState()).toMatchObject({ uid: null, status: "idle" });
  });
});
