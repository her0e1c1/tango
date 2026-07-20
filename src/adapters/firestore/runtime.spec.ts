/**
 * @file Verifies the "Firestore runtime" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps one injected instance
 * and rejects a different duplicate initialization", "waits until the injected Firestore instance
 * is ready", "preserves a blocking initialization error without allowing memory fallback".
 */

import type { Firestore } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";

import { createFirestoreRuntime } from "@/adapters/firestore/runtime";

describe("Firestore runtime", () => {
  it("keeps one injected instance and rejects a different duplicate initialization", () => {
    const runtime = createFirestoreRuntime();
    const db = { name: "first" } as unknown as Firestore;

    runtime.initialize(db);
    runtime.initialize(db);

    expect(runtime.getDb()).toBe(db);
    expect(runtime.getState()).toEqual({ status: "ready" });
    expect(() => runtime.initialize({ name: "second" } as unknown as Firestore)).toThrow(
      "Firestore runtime is already initialized"
    );
  });

  it("waits until the injected Firestore instance is ready", async () => {
    const runtime = createFirestoreRuntime();
    const db = { name: "persistent" } as unknown as Firestore;
    const onChange = vi.fn();
    runtime.subscribe(onChange);

    expect(runtime.getState()).toEqual({ status: "initializing" });
    runtime.initialize(db);

    await expect(runtime.waitForInitialization()).resolves.toEqual({ status: "ready" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("preserves a blocking initialization error without allowing memory fallback", async () => {
    const runtime = createFirestoreRuntime();
    const error = new Error("persistent cache unavailable");

    runtime.block(error);

    expect(runtime.getState()).toEqual({ status: "blocked", error });
    expect(() => runtime.getDb()).toThrow(error);
    expect(() => runtime.initialize({} as Firestore)).toThrow(error);
    await expect(runtime.waitForInitialization()).resolves.toEqual({ status: "blocked", error });
  });
});
