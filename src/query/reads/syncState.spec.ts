import { describe, expect, it, vi } from "vitest";

import { createSyncState } from "@/query/reads/syncState";

describe("remote sync state", () => {
  it("distinguishes cached, pending, and server-synced snapshots after both collections load", () => {
    const controller = createSyncState(["deck", "card"]);
    const generation = controller.start("uid-a");

    controller.observe("uid-a", generation, "deck", { fromCache: true, hasPendingWrites: false });
    expect(controller.getSnapshot()).toEqual({ uid: "uid-a", status: "loading" });

    controller.observe("uid-a", generation, "card", { fromCache: false, hasPendingWrites: false });
    expect(controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "cached" });

    controller.observe("uid-a", generation, "deck", { fromCache: false, hasPendingWrites: false });
    expect(controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "synced" });

    controller.observe("uid-a", generation, "card", { fromCache: true, hasPendingWrites: true });
    expect(controller.getSnapshot()).toEqual({ uid: "uid-a", status: "ready", syncStatus: "pending" });
  });

  it("ignores snapshots and errors from an old UID generation", () => {
    const controller = createSyncState(["deck", "card"]);
    const oldGeneration = controller.start("uid-a");
    const currentGeneration = controller.start("uid-b");

    controller.observe("uid-a", oldGeneration, "deck", { fromCache: false, hasPendingWrites: false });
    controller.fail("uid-a", oldGeneration, new Error("stale listener"));

    expect(controller.getSnapshot()).toEqual({ uid: "uid-b", status: "loading" });

    controller.observe("uid-b", currentGeneration, "deck", { fromCache: false, hasPendingWrites: false });
    controller.observe("uid-b", currentGeneration, "card", { fromCache: false, hasPendingWrites: false });
    expect(controller.getSnapshot()).toEqual({ uid: "uid-b", status: "ready", syncStatus: "synced" });
  });

  it("publishes listener errors and resets to idle when stopped", () => {
    const controller = createSyncState(["deck", "card"]);
    const listener = vi.fn();
    controller.subscribe(listener);
    const generation = controller.start("uid-a");
    const error = new Error("listener failed");

    controller.fail("uid-a", generation, error);
    expect(controller.getSnapshot()).toEqual({ uid: "uid-a", status: "error", error });

    controller.stop("uid-a");
    expect(controller.getSnapshot()).toEqual({ uid: null, status: "idle" });
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
