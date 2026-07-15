import { describe, expect, it, vi } from "vitest";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { app, auth } from "@/firebase";

const singletons = vi.hoisted(() => ({
  app: { name: "app" },
  auth: { currentUser: null },
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => singletons.app),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => singletons.auth),
}));

vi.mock("firebase/firestore", () => ({
  connectFirestoreEmulator: vi.fn(),
  getFirestore: vi.fn(() => ({})),
}));

describe("Firebase singletons", () => {
  it("exports one app and its stable auth instance", () => {
    expect(app).toBe(singletons.app);
    expect(auth).toBe(singletons.auth);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledWith(app);
    expect(getAuth).toHaveBeenCalledTimes(1);
  });
});
