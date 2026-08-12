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
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const singletons = vi.hoisted(() => ({
  app: { name: "app" },
  auth: { currentUser: null },
  db: { type: "firestore", _firestoreClient: { _offlineComponents: { kind: "persistent" } } },
  functions: { type: "functions" },
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

vi.mock("firebase/functions", () => ({
  connectFunctionsEmulator: vi.fn(),
  getFunctions: vi.fn(() => singletons.functions),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
  singletons.db._firestoreClient._offlineComponents.kind = "persistent";
});

describe("Firebase singletons", () => {
  it("exports one app with stable auth and Firestore instances", async () => {
    const first = await import("@/shared/firebase");
    const second = await import("@/shared/firebase");

    expect(first.app).toBe(singletons.app);
    expect(first.auth).toBe(singletons.auth);
    expect(first.functions).toBe(singletons.functions);
    expect(first.getDb()).toBe(singletons.db);
    expect(second.getDb()).toBe(first.getDb());
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(singletons.app);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(getFunctions).toHaveBeenCalledExactlyOnceWith(singletons.app);
    expect(initializeFirestore).toHaveBeenCalledTimes(1);
  });

  it("uses persistent single-tab cache in production", async () => {
    vi.stubEnv("PROD", true);

    const firebase = await import("@/shared/firebase");
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

    const { getDb } = await import("@/shared/firebase");

    expect(memoryLocalCache).toHaveBeenCalledTimes(1);
    expect(initializeFirestore).toHaveBeenCalledWith(singletons.app, { localCache: "memory-cache" });
    expect(connectFirestoreEmulator).toHaveBeenCalledWith(getDb(), "127.0.0.1", 8080);
    expect(persistentLocalCache).not.toHaveBeenCalled();
  });

  it("blocks startup when the Firestore emulator connection fails", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_DB_HOST", "127.0.0.1");
    vi.stubEnv("VITE_DB_PORT", "8080");
    const failure = new Error("emulator connection failed");
    vi.mocked(connectFirestoreEmulator).mockImplementationOnce(() => {
      throw failure;
    });

    const firebase = await import("@/shared/firebase");

    await expect(firebase.waitForFirestoreInitialization()).resolves.toEqual({ status: "blocked", error: failure });
    expect(() => firebase.getDb()).toThrow(failure);
  });

  it("exposes a blocking startup result instead of falling back when persistence initialization fails", async () => {
    vi.stubEnv("PROD", true);
    const failure = new Error("single-tab persistence unavailable");
    vi.mocked(initializeFirestore).mockImplementationOnce(() => {
      throw failure;
    });

    const { getDb, waitForFirestoreInitialization } = await import("@/shared/firebase");

    await expect(waitForFirestoreInitialization()).resolves.toEqual({ status: "blocked", error: failure });
    expect(() => getDb()).toThrow(failure);
    expect(memoryLocalCache).not.toHaveBeenCalled();
  });

  it("does not require Web Locks for the production cache", async () => {
    vi.stubEnv("PROD", true);
    vi.stubGlobal("navigator", { ...navigator, locks: undefined });

    const firebase = await import("@/shared/firebase");

    await expect(firebase.waitForFirestoreInitialization()).resolves.toEqual({
      status: "ready",
    });
    expect(firebase.getDb()).toBe(singletons.db);
    expect(memoryLocalCache).not.toHaveBeenCalled();
  });

  it("blocks startup when Firestore silently falls back to memory", async () => {
    vi.stubEnv("PROD", true);
    singletons.db._firestoreClient._offlineComponents.kind = "memory";

    const firebase = await import("@/shared/firebase");

    await expect(firebase.waitForFirestoreInitialization()).resolves.toEqual({
      status: "blocked",
      error: expect.objectContaining({ name: "FirestorePersistenceUnavailableError" }),
    });
    expect(getDocsFromCache).toHaveBeenCalledTimes(1);
    expect(terminate).toHaveBeenCalledWith(singletons.db);
    expect(() => firebase.getDb()).toThrow("Memory fallback is disabled");
  });

  it("connects auth to the configured emulator in development", async () => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_AUTH_HOST", "127.0.0.1");
    vi.stubEnv("VITE_AUTH_PORT", "9099");

    const { auth } = await import("@/shared/firebase");

    expect(connectAuthEmulator).toHaveBeenCalledWith(auth, "http://127.0.0.1:9099");
  });

  it("connects Functions to the configured emulator in development", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_FUNCTIONS_HOST", "127.0.0.1");
    vi.stubEnv("VITE_FUNCTIONS_PORT", "5001");

    const { functions } = await import("@/shared/firebase");

    expect(connectFunctionsEmulator).toHaveBeenCalledExactlyOnceWith(functions, "127.0.0.1", 5001);
  });

  it.each([
    ["host", "", "9099"],
    ["port", "127.0.0.1", ""],
  ])("does not connect auth when the emulator %s is missing", async (_missingSetting, host, port) => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_AUTH_HOST", host);
    vi.stubEnv("VITE_AUTH_PORT", port);

    await import("@/shared/firebase");

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });

  it("does not connect auth to the emulator in production", async () => {
    vi.stubEnv("MODE", "production");
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_AUTH_HOST", "127.0.0.1");
    vi.stubEnv("VITE_AUTH_PORT", "9099");

    await import("@/shared/firebase");

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });

  it("does not connect auth to an invalid URL when the emulator is not configured", async () => {
    vi.stubEnv("MODE", "development");
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_AUTH_HOST", "");
    vi.stubEnv("VITE_AUTH_PORT", "");

    await import("@/shared/firebase");

    expect(connectAuthEmulator).not.toHaveBeenCalled();
  });
});
