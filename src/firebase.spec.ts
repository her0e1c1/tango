/**
 * @file Verifies the "Firebase singletons" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "exports one app with stable
 * auth and Firestore instances", "uses persistent single-tab cache in production", "uses
 * injectable memory cache for tests and the emulator".
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getDocsFromCache,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
  terminate,
} from "firebase/firestore";

const singletons = vi.hoisted(() => ({
  app: { name: "app" },
  auth: { currentUser: null },
  db: { type: "firestore", _firestoreClient: { _offlineComponents: { kind: "persistent" } } },
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => singletons.app),
}));

vi.mock("firebase/auth", () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: vi.fn(() => singletons.auth),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "probe-collection"),
  connectFirestoreEmulator: vi.fn(),
  getDocsFromCache: vi.fn(async () => ({ docs: [] })),
  initializeFirestore: vi.fn(() => singletons.db),
  memoryLocalCache: vi.fn(() => "memory-cache"),
  persistentLocalCache: vi.fn((settings) => ({ type: "persistent-cache", settings })),
  persistentSingleTabManager: vi.fn(() => "single-tab-manager"),
  query: vi.fn(() => "probe-query"),
  terminate: vi.fn(async () => undefined),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
  singletons.db._firestoreClient._offlineComponents.kind = "persistent";
});

describe("Firebase singletons", () => {
  it("exports one app with stable auth and Firestore instances", async () => {
    const first = await import("@/firebase");
    const second = await import("@/firebase");

    expect(first.app).toBe(singletons.app);
    expect(first.auth).toBe(singletons.auth);
    expect(first.getDb()).toBe(singletons.db);
    expect(second.getDb()).toBe(first.getDb());
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(singletons.app);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(initializeFirestore).toHaveBeenCalledTimes(1);
  });

  it("uses persistent single-tab cache in production", async () => {
    vi.stubEnv("PROD", true);

    const firebase = await import("@/firebase");
    await firebase.waitForFirestoreInitialization();

    expect(persistentSingleTabManager).toHaveBeenCalledWith({});
    expect(persistentLocalCache).toHaveBeenCalledWith({ tabManager: "single-tab-manager" });
    expect(initializeFirestore).toHaveBeenCalledWith(singletons.app, {
      localCache: { type: "persistent-cache", settings: { tabManager: "single-tab-manager" } },
    });
    expect(memoryLocalCache).not.toHaveBeenCalled();
  });

  it("uses injectable memory cache for tests and the emulator", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_DB_HOST", "127.0.0.1");
    vi.stubEnv("VITE_DB_PORT", "8080");

    const { getDb } = await import("@/firebase");

    expect(memoryLocalCache).toHaveBeenCalledTimes(1);
    expect(initializeFirestore).toHaveBeenCalledWith(singletons.app, { localCache: "memory-cache" });
    expect(connectFirestoreEmulator).toHaveBeenCalledWith(getDb(), "127.0.0.1", 8080);
    expect(persistentLocalCache).not.toHaveBeenCalled();
  });

  it("exposes a blocking startup state instead of falling back when persistence initialization fails", async () => {
    vi.stubEnv("PROD", true);
    const failure = new Error("single-tab persistence unavailable");
    vi.mocked(initializeFirestore).mockImplementationOnce(() => {
      throw failure;
    });

    const { getDb, getFirestoreInitializationState } = await import("@/firebase");

    expect(getFirestoreInitializationState()).toEqual({ status: "blocked", error: failure });
    expect(() => getDb()).toThrow(failure);
    expect(memoryLocalCache).not.toHaveBeenCalled();
  });

  it("does not require Web Locks for the production cache", async () => {
    vi.stubEnv("PROD", true);
    vi.stubGlobal("navigator", { ...navigator, locks: undefined });

    const firebase = await import("@/firebase");

    await expect(firebase.waitForFirestoreInitialization()).resolves.toEqual({
      status: "ready",
    });
    expect(firebase.getDb()).toBe(singletons.db);
    expect(memoryLocalCache).not.toHaveBeenCalled();
  });

  it("blocks startup when Firestore silently falls back to memory", async () => {
    vi.stubEnv("PROD", true);
    singletons.db._firestoreClient._offlineComponents.kind = "memory";

    const firebase = await import("@/firebase");

    await expect(firebase.waitForFirestoreInitialization()).resolves.toEqual({
      status: "blocked",
      error: expect.objectContaining({ name: "FirestorePersistenceUnavailableError" }),
    });
    expect(getDocsFromCache).toHaveBeenCalledTimes(1);
    expect(terminate).toHaveBeenCalledWith(singletons.db);
    expect(() => firebase.getDb()).toThrow("Memory fallback is disabled");
  });

  it("connects auth to the configured emulator in dev mode", async () => {
    vi.stubEnv("MODE", "dev");
    vi.stubEnv("VITE_AUTH_HOST", "127.0.0.1");
    vi.stubEnv("VITE_AUTH_PORT", "9099");

    const { auth } = await import("@/firebase");

    expect(connectAuthEmulator).toHaveBeenCalledWith(auth, "http://127.0.0.1:9099");
  });

  it("does not connect auth to the emulator in test mode", async () => {
    vi.stubEnv("MODE", "test");

    await import("@/firebase");

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });
});
