import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteSubscriptionProps } from "@/shared/api";
import type { FirestoreInitializationResult } from "@/shared/firestore";
import { createRemoteReadStore, type RemoteReadDependencies } from "@/shared/lib/remote-read/createRemoteReadStore";

interface Item {
  id: string;
  value: string;
}

const synced = { fromCache: false, hasPendingWrites: false };
const createItem = (id: string): Item => ({ id, value: id });

const createHarness = (
  waitForInitialization: RemoteReadDependencies<Item>["waitForInitialization"] = vi.fn<
    RemoteReadDependencies<Item>["waitForInitialization"]
  >(async () => ({ status: "ready" }))
) => {
  const subscriptions: Array<RemoteSubscriptionProps<Item>> = [];
  const unsubscribes: ReturnType<typeof vi.fn>[] = [];
  const dependencies: RemoteReadDependencies<Item> = {
    waitForInitialization,
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

const publish = (harness: ReturnType<typeof createHarness>, items: Item[] = [], metadata = synced) => {
  harness.subscriptions.at(-1)?.onSnapshot({
    type: "replace",
    items,
    metadata,
  });
};

describe("createRemoteReadStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts idle and becomes ready from its own initial snapshot", async () => {
    const harness = createHarness();
    const item = createItem("item");

    await harness.store.getState().start("uid-a");

    expect(harness.store.getState()).toMatchObject({
      uid: "uid-a",
      status: "loading",
      itemsById: {},
      start: expect.any(Function),
      stop: expect.any(Function),
      retry: expect.any(Function),
    });

    publish(harness, [item], { ...synced, fromCache: true });

    expect(harness.store.getState()).toMatchObject({
      status: "ready",
      syncStatus: "cached",
      itemsById: { [item.id]: item },
    });
  });

  it("derives pending, cached, and synced states from each snapshot", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");

    publish(harness, [], { ...synced, hasPendingWrites: true });
    expect(harness.store.getState().syncStatus).toBe("pending");

    publish(harness, [], { ...synced, fromCache: true });
    expect(harness.store.getState().syncStatus).toBe("cached");

    publish(harness);
    expect(harness.store.getState().syncStatus).toBe("synced");
  });

  it("applies incremental changes after the initial collection", async () => {
    const harness = createHarness();
    const first = createItem("first");
    const second = createItem("second");
    await harness.store.getState().start("uid-a");
    publish(harness, [first]);

    harness.subscriptions[0]?.onSnapshot({
      type: "change",
      event: { added: [second], modified: [{ ...first, value: "updated" }], removed: [] },
      metadata: synced,
    });

    expect(harness.store.getState().itemsById).toEqual({
      first: { ...first, value: "updated" },
      second,
    });
  });

  it("stops its listener and ignores stale callbacks", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    harness.store.getState().stop("uid-a");

    expect(harness.unsubscribes[0]).toHaveBeenCalledOnce();
    expect(harness.store.getState()).toMatchObject({ uid: null, status: "idle", itemsById: {} });

    staleSubscription?.onSnapshot({
      type: "replace",
      items: [createItem("stale")],
      metadata: synced,
    });
    expect(harness.store.getState().itemsById).toEqual({});
  });

  it("ignores snapshots from a previous UID", async () => {
    const harness = createHarness();
    await harness.store.getState().start("uid-a");
    const staleSubscription = harness.subscriptions[0];

    await harness.store.getState().start("uid-b");
    const current = createItem("current");
    publish(harness, [current]);
    staleSubscription?.onSnapshot({
      type: "replace",
      items: [createItem("stale")],
      metadata: synced,
    });

    expect(harness.store.getState()).toMatchObject({
      uid: "uid-b",
      itemsById: { [current.id]: current },
    });
  });

  it("retains data for a same-UID retry and clears it for another UID", async () => {
    const harness = createHarness();
    const item = createItem("item");
    await harness.store.getState().start("uid-a");
    publish(harness, [item]);
    harness.subscriptions[0]?.onError(new Error("listener failed"));

    const retry = harness.store.getState().retry();
    expect(harness.store.getState()).toMatchObject({
      uid: "uid-a",
      status: "loading",
      itemsById: { [item.id]: item },
    });
    await retry;

    await harness.store.getState().start("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-b", status: "loading", itemsById: {} });
  });

  it("publishes initialization, blocked, and listener failures", async () => {
    const initializationFailure = new Error("initialization failed");
    const rejected = createHarness(vi.fn().mockRejectedValue(initializationFailure));
    await expect(rejected.store.getState().start("uid-a")).rejects.toBe(initializationFailure);
    expect(rejected.store.getState()).toMatchObject({ status: "error", error: initializationFailure });

    const blocker = new Error("persistence blocked");
    const waitForInitialization = vi
      .fn<RemoteReadDependencies<Item>["waitForInitialization"]>()
      .mockResolvedValueOnce({ status: "blocked", error: blocker })
      .mockResolvedValue({ status: "ready" });
    const blocked = createHarness(waitForInitialization);
    await blocked.store.getState().start("uid-a");
    expect(blocked.store.getState()).toMatchObject({ uid: "uid-a", status: "blocked", error: blocker });
    expect(blocked.dependencies.subscribe).not.toHaveBeenCalled();
    await blocked.store.getState().retry();
    expect(blocked.dependencies.subscribe).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ uid: "uid-a" }));

    const listenerFailure = new Error("listener failed");
    const listener = createHarness();
    await listener.store.getState().start("uid-a");
    listener.subscriptions[0]?.onError(listenerFailure);
    expect(listener.store.getState()).toMatchObject({ status: "error", error: listenerFailure });
    expect(listener.unsubscribes[0]).toHaveBeenCalledOnce();

    listener.subscriptions[0]?.onSnapshot({
      type: "replace",
      items: [createItem("stale")],
      metadata: synced,
    });
    expect(listener.store.getState()).toMatchObject({ status: "error", itemsById: {} });
  });

  it.each(["blocked", "error"] as const)("resets %s state only for the matching UID", async (status) => {
    const error = new Error(`${status} read`);
    const harness =
      status === "blocked"
        ? createHarness(vi.fn<RemoteReadDependencies<Item>["waitForInitialization"]>(async () => ({ status, error })))
        : createHarness();
    await harness.store.getState().start("uid-a");
    if (status === "error") harness.subscriptions[0]?.onError(error);
    harness.store.getState().stop("uid-b");
    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status, error });

    harness.store.getState().stop("uid-a");
    expect(harness.store.getState()).toMatchObject({
      uid: null,
      status: "idle",
      itemsById: {},
      syncStatus: undefined,
      error: undefined,
    });
  });

  it("does not create a listener when stopped during initialization", async () => {
    let resolveInitialization!: (result: FirestoreInitializationResult) => void;
    const initialization = new Promise<FirestoreInitializationResult>((resolve) => {
      resolveInitialization = resolve;
    });
    const harness = createHarness(vi.fn(() => initialization));

    const start = harness.store.getState().start("uid-a");
    harness.store.getState().stop("uid-a");
    resolveInitialization({ status: "ready" });
    await start;

    expect(harness.dependencies.subscribe).not.toHaveBeenCalled();
    expect(harness.store.getState()).toMatchObject({ uid: null, status: "idle" });
  });

  it("publishes an error when listener setup throws", async () => {
    const harness = createHarness();
    const failure = new Error("listener setup failed");
    vi.mocked(harness.dependencies.subscribe).mockImplementationOnce(() => {
      throw failure;
    });

    await expect(harness.store.getState().start("uid-a")).rejects.toBe(failure);

    expect(harness.store.getState()).toMatchObject({ uid: "uid-a", status: "error", error: failure });
  });

  it("creates a listener only for the latest UID when initialization overlaps", async () => {
    let resolveInitialization!: (result: FirestoreInitializationResult) => void;
    const initialization = new Promise<FirestoreInitializationResult>((resolve) => {
      resolveInitialization = resolve;
    });
    const harness = createHarness(vi.fn(() => initialization));

    const stale = harness.store.getState().start("uid-a");
    const current = harness.store.getState().start("uid-b");
    resolveInitialization({ status: "ready" });
    await Promise.all([stale, current]);

    expect(harness.dependencies.subscribe).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ uid: "uid-b" }));
  });
});
