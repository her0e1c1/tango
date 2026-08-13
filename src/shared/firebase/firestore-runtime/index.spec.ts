import type { Firestore } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Firestore runtime", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects reads before initialization", async () => {
    const runtime = await import(".");

    expect(() => runtime.getDb()).toThrow("Firestore is not initialized");
  });

  it("keeps one injected instance and rejects a different duplicate initialization", async () => {
    const runtime = await import(".");
    const db = { name: "first" } as unknown as Firestore;

    runtime.initializeFirestoreRuntime(db);
    runtime.initializeFirestoreRuntime(db);

    expect(runtime.getDb()).toBe(db);
    expect(() => runtime.initializeFirestoreRuntime({ name: "second" } as unknown as Firestore)).toThrow(
      "Firestore runtime is already initialized"
    );
  });

  it("releases every reader after initialization", async () => {
    const runtime = await import(".");
    const db = { name: "persistent" } as unknown as Firestore;
    const first = runtime.waitForFirestoreInitialization();
    const second = runtime.waitForFirestoreInitialization();

    runtime.initializeFirestoreRuntime(db);

    await expect(Promise.all([first, second])).resolves.toEqual([{ status: "ready" }, { status: "ready" }]);
  });

  it("preserves a blocking initialization error without allowing initialization", async () => {
    const runtime = await import(".");
    const error = new Error("persistent cache unavailable");

    runtime.blockFirestoreRuntime(error);

    expect(() => runtime.getDb()).toThrow(error);
    expect(() => runtime.initializeFirestoreRuntime({} as Firestore)).toThrow(error);
    await expect(runtime.waitForFirestoreInitialization()).resolves.toEqual({ status: "blocked", error });
  });

  it("keeps ready as a terminal state", async () => {
    const runtime = await import(".");
    const db = { name: "persistent" } as unknown as Firestore;

    runtime.initializeFirestoreRuntime(db);

    expect(() => runtime.blockFirestoreRuntime(new Error("late failure"))).toThrow(
      "Firestore runtime is already initialized"
    );
    expect(runtime.getDb()).toBe(db);
    await expect(runtime.waitForFirestoreInitialization()).resolves.toEqual({ status: "ready" });
  });
});
