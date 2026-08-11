/**
 * @file Verifies the "AuthBootstrap integration" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "starts remote reads once
 * for one confirmed state under StrictMode and AuthProvider", "automatically retries a failed
 * unchanged auth request only once".
 */

import { act, render, waitFor } from "@testing-library/react";
import type { Auth, User, UserCredential } from "firebase/auth";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInAnonymously: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: Object.assign(vi.fn(), { credentialFromError: vi.fn() }),
  linkWithPopup: vi.fn(),
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInAnonymously: mocks.signInAnonymously,
  signInWithCredential: vi.fn(),
}));
vi.mock("@/store/remoteStore", () => ({
  remoteStore: { getState: () => ({ start: mocks.start, stop: mocks.stop }) },
}));

import { AuthBootstrap, AuthProvider } from "@/app/providers/auth";
import { createAuthRuntime } from "@/features/auth";

/**
 * Provides the create harness test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createHarness = () => {
  let publishUser: (user: User | null) => void = () => undefined;
  const runtime = createAuthRuntime({
    auth: {} as Auth,
    onAuthStateChanged: vi.fn((_auth, onUser) => {
      publishUser = onUser;
      return vi.fn();
    }),
    signInAnonymously: vi.fn<() => Promise<UserCredential>>(),
  });
  render(
    <React.StrictMode>
      <AuthProvider runtime={runtime}>
        <AuthBootstrap />
      </AuthProvider>
    </React.StrictMode>
  );
  return { publishUser, runtime };
};

describe("AuthBootstrap integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.start.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts remote reads once for one confirmed state under StrictMode and AuthProvider", async () => {
    const { publishUser, runtime } = createHarness();

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(1));
    expect(mocks.start).toHaveBeenCalledWith("uid-a");
    runtime.controller.dispose();
  });

  it("automatically retries a failed unchanged auth request only once", async () => {
    const subscribeError = new Error("subscribe failed");
    mocks.start.mockRejectedValue(subscribeError);
    const { publishUser, runtime } = createHarness();

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    expect(mocks.start).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith("Auth transition failed", subscribeError);
    runtime.controller.dispose();
  });
});
