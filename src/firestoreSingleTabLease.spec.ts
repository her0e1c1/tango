import { describe, expect, it, vi } from "vitest";

import { type FirestoreLockManager, startFirestoreSingleTabLease } from "@/firestoreSingleTabLease";

describe("Firestore single-tab lease", () => {
  it("holds an exclusive Web Lock until explicitly released", async () => {
    let lockRequest: Promise<void> | undefined;
    const locks: FirestoreLockManager = {
      request: vi.fn((_name, _options, callback): Promise<void> => {
        const request = callback({ name: "tango-firestore" });
        lockRequest = request;
        return request;
      }),
    };

    const lease = startFirestoreSingleTabLease(locks);

    await expect(lease.ready).resolves.toEqual({ status: "ready" });
    expect(locks.request).toHaveBeenCalledWith(
      "tango-firestore-persistence",
      { mode: "exclusive", ifAvailable: true },
      expect.any(Function)
    );
    let settled = false;
    void lockRequest?.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    lease.release();
    await lockRequest;
    expect(settled).toBe(true);
  });

  it("returns a dedicated blocker when another tab owns the lease", async () => {
    const locks: FirestoreLockManager = {
      request: vi.fn((_name, _options, callback) => callback(null)),
    };

    const lease = startFirestoreSingleTabLease(locks);

    await expect(lease.ready).resolves.toEqual({
      status: "blocked",
      error: expect.objectContaining({ name: "FirestoreSingleTabLeaseError" }),
    });
  });

  it("returns a blocker when the browser lock request fails", async () => {
    const failure = new Error("Web Locks unavailable");
    const locks: FirestoreLockManager = { request: vi.fn(async () => Promise.reject(failure)) };

    const lease = startFirestoreSingleTabLease(locks);

    await expect(lease.ready).resolves.toEqual({ status: "blocked", error: failure });
  });
});
