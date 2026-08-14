import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const singletons = vi.hoisted(() => ({
  app: { name: "app" },
  auth: { currentUser: null },
  db: { type: "firestore" },
  tabManager: { type: "multiple-tab" },
  localCache: { type: "persistent-cache" },
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => singletons.app),
}));

vi.mock("firebase/auth", () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: vi.fn(() => singletons.auth),
}));

vi.mock("firebase/firestore", () => ({
  connectFirestoreEmulator: vi.fn(),
  initializeFirestore: vi.fn(() => singletons.db),
  persistentLocalCache: vi.fn(() => singletons.localCache),
  persistentMultipleTabManager: vi.fn(() => singletons.tabManager),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});
const importFirebase = async () => import("@/shared/firebase");

describe("Firebase services", () => {
  it("exports stable auth and Firestore instances with multi-tab persistence", async () => {
    const first = await importFirebase();
    const second = await importFirebase();

    expect(first.auth).toBe(singletons.auth);
    expect(first.db).toBe(singletons.db);
    expect(second.auth).toBe(first.auth);
    expect(second.db).toBe(first.db);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(singletons.app);
    expect(persistentMultipleTabManager).toHaveBeenCalledWith();
    expect(persistentLocalCache).toHaveBeenCalledWith({ tabManager: singletons.tabManager });
    expect(initializeFirestore).toHaveBeenCalledWith(singletons.app, { localCache: singletons.localCache });
  });

  it("connects configured emulators in development", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_AUTH_HOST", "127.0.0.1");
    vi.stubEnv("VITE_AUTH_PORT", "9099");
    vi.stubEnv("VITE_DB_HOST", "127.0.0.1");
    vi.stubEnv("VITE_DB_PORT", "8080");

    const firebase = await importFirebase();

    expect(connectAuthEmulator).toHaveBeenCalledWith(firebase.auth, "http://127.0.0.1:9099");
    expect(connectFirestoreEmulator).toHaveBeenCalledWith(firebase.db, "127.0.0.1", 8080);
  });

  it.each([
    ["auth host", "", "9099", "127.0.0.1", "8080"],
    ["auth port", "127.0.0.1", "", "127.0.0.1", "8080"],
    ["Firestore host", "127.0.0.1", "9099", "", "8080"],
    ["Firestore port", "127.0.0.1", "9099", "127.0.0.1", ""],
  ])(
    "does not connect the emulator whose %s is missing",
    async (missingSetting, authHost, authPort, dbHost, dbPort) => {
      vi.stubEnv("DEV", true);
      vi.stubEnv("VITE_AUTH_HOST", authHost);
      vi.stubEnv("VITE_AUTH_PORT", authPort);
      vi.stubEnv("VITE_DB_HOST", dbHost);
      vi.stubEnv("VITE_DB_PORT", dbPort);

      await importFirebase();

      if (missingSetting.startsWith("auth")) {
        expect(connectAuthEmulator).not.toHaveBeenCalled();
        expect(connectFirestoreEmulator).toHaveBeenCalledTimes(1);
      } else {
        expect(connectAuthEmulator).toHaveBeenCalledTimes(1);
        expect(connectFirestoreEmulator).not.toHaveBeenCalled();
      }
    }
  );

  it("does not connect configured emulators in production", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_AUTH_HOST", "127.0.0.1");
    vi.stubEnv("VITE_AUTH_PORT", "9099");
    vi.stubEnv("VITE_DB_HOST", "127.0.0.1");
    vi.stubEnv("VITE_DB_PORT", "8080");

    await importFirebase();

    expect(connectAuthEmulator).not.toHaveBeenCalled();
    expect(connectFirestoreEmulator).not.toHaveBeenCalled();
  });

  it("surfaces Firestore initialization failures", async () => {
    const failure = new Error("IndexedDB is unavailable");
    vi.mocked(initializeFirestore).mockImplementationOnce(() => {
      throw failure;
    });

    await expect(importFirebase()).rejects.toBe(failure);
  });
});
