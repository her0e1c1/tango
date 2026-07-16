import { afterEach, describe, expect, it, vi } from "vitest";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const singletons = vi.hoisted(() => ({
  app: { name: "app" },
  auth: { currentUser: null },
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
  getFirestore: vi.fn(() => ({})),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Firebase singletons", () => {
  it("exports one app and its stable auth instance", async () => {
    const { app, auth } = await import("@/firebase");

    expect(app).toBe(singletons.app);
    expect(auth).toBe(singletons.auth);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(app);
    expect(getAuth).toHaveBeenCalledTimes(1);
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
