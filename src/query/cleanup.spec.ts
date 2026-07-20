/**
 * @file Verifies the "cleanupFirestoreUid" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "stops subscriptions before
 * clearing the matching Store UID", "keeps Store data for a different UID", "finishes Store cleanup
 * before surfacing a listener stop error".
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { stopRemoteReads } = vi.hoisted(() => ({ stopRemoteReads: vi.fn() }));

vi.mock("@/query/reads/remoteReadSession", () => ({ stopRemoteReads }));

import { cleanupFirestoreUid } from "@/query/cleanup";
import { createRemoteStore, remoteStore } from "@/store/remoteStore";

describe("cleanupFirestoreUid", () => {
  beforeEach(() => {
    stopRemoteReads.mockReset();
    remoteStore.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    remoteStore.clear();
  });

  it("stops subscriptions before clearing the matching Store UID", async () => {
    const operations: string[] = [];
    stopRemoteReads.mockImplementation(() => operations.push("stop-remote"));
    remoteStore.begin("uid-a");
    const clear = vi.spyOn(remoteStore, "clear").mockImplementation((uid) => {
      operations.push(`clear:${uid}`);
    });

    await cleanupFirestoreUid("uid-a");

    expect(operations).toEqual(["stop-remote", "clear:uid-a"]);
    expect(stopRemoteReads).toHaveBeenCalledWith("uid-a");
    expect(clear).toHaveBeenCalledWith("uid-a");
  });

  it("keeps Store data for a different UID", async () => {
    const store = createRemoteStore();
    store.begin("uid-b");

    await cleanupFirestoreUid("uid-a", store);

    expect(store.getSnapshot()).toEqual({ uid: "uid-b", status: "loading", decksById: {}, cardsById: {} });
    expect(stopRemoteReads).toHaveBeenCalledWith("uid-a");
  });

  it("finishes Store cleanup before surfacing a listener stop error", async () => {
    const stopError = new Error("listener stop failed");
    const operations: string[] = [];
    const store = createRemoteStore();
    store.begin("uid-a");
    stopRemoteReads.mockImplementation(() => {
      operations.push("stop");
      throw stopError;
    });
    vi.spyOn(store, "clear").mockImplementation(() => {
      operations.push("clear");
    });

    await expect(cleanupFirestoreUid("uid-a", store)).rejects.toBe(stopError);

    expect(operations).toEqual(["stop", "clear"]);
  });

  it("surfaces a Store cleanup error", async () => {
    const cleanupError = new Error("Store cleanup failed");
    const operations: string[] = [];
    const store = createRemoteStore();
    stopRemoteReads.mockImplementation(() => operations.push("stop"));
    vi.spyOn(store, "clear").mockImplementation(() => {
      operations.push("clear");
      throw cleanupError;
    });

    await expect(cleanupFirestoreUid("uid-a", store)).rejects.toBe(cleanupError);

    expect(operations).toEqual(["stop", "clear"]);
  });
});
