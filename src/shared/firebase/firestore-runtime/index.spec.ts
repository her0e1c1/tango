import type { Firestore } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { createFirestoreRuntime } from ".";

describe("Firestore runtime", () => {
  it("rejects reads before initialization", () => {
    const runtime = createFirestoreRuntime();

    expect(() => runtime.getDb()).toThrow("Firestore is not initialized");
  });

  it("keeps one injected instance and rejects a different duplicate initialization", () => {
    const runtime = createFirestoreRuntime();
    const db = { name: "first" } as unknown as Firestore;

    runtime.initialize(db);
    runtime.initialize(db);

    expect(runtime.getDb()).toBe(db);
    expect(() => runtime.initialize({ name: "second" } as unknown as Firestore)).toThrow(
      "Firestore runtime is already initialized"
    );
  });

  it("waits until the injected Firestore instance is ready", async () => {
    const runtime = createFirestoreRuntime();
    const db = { name: "persistent" } as unknown as Firestore;

    runtime.initialize(db);

    await expect(runtime.waitForInitialization()).resolves.toEqual({ status: "ready" });
  });

  it("shares one initialization promise across readers", () => {
    const runtime = createFirestoreRuntime();

    expect(runtime.waitForInitialization()).toBe(runtime.waitForInitialization());
  });

  it("preserves a blocking initialization error without allowing initialization", async () => {
    const runtime = createFirestoreRuntime();
    const error = new Error("persistent cache unavailable");

    runtime.block(error);

    expect(() => runtime.getDb()).toThrow(error);
    expect(() => runtime.initialize({} as Firestore)).toThrow(error);
    await expect(runtime.waitForInitialization()).resolves.toEqual({ status: "blocked", error });
  });

  it("keeps ready as a terminal state", async () => {
    const runtime = createFirestoreRuntime();
    const db = { name: "persistent" } as unknown as Firestore;

    runtime.initialize(db);

    expect(() => runtime.block(new Error("late failure"))).toThrow("Firestore runtime is already initialized");
    expect(runtime.getDb()).toBe(db);
    await expect(runtime.waitForInitialization()).resolves.toEqual({ status: "ready" });
  });
});
