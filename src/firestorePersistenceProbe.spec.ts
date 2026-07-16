import type { Firestore } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";

import { FirestorePersistenceUnavailableError, verifyFirestorePersistence } from "@/firestorePersistenceProbe";

const firestoreWithCacheKind = (kind: string): Firestore =>
  ({ _firestoreClient: { _offlineComponents: { kind } } }) as unknown as Firestore;

describe("Firestore persistence probe", () => {
  it("warms the local cache and accepts the initialized persistent provider", async () => {
    const db = firestoreWithCacheKind("persistent");
    const warmCache = vi.fn(async () => undefined);

    await expect(verifyFirestorePersistence(db, warmCache)).resolves.toBeUndefined();

    expect(warmCache).toHaveBeenCalledWith(db);
  });

  it("rejects the SDK's silent memory fallback", async () => {
    const db = firestoreWithCacheKind("memory");

    await expect(verifyFirestorePersistence(db, async () => undefined)).rejects.toBeInstanceOf(
      FirestorePersistenceUnavailableError
    );
  });

  it("propagates IndexedDB initialization errors", async () => {
    const failure = new Error("IndexedDB schema failed");

    await expect(
      verifyFirestorePersistence(firestoreWithCacheKind("persistent"), async () => Promise.reject(failure))
    ).rejects.toBe(failure);
  });
});
