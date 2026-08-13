/**
 * @file Verifies the "RemoteReadBootstrap integration" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "starts remote reads once
 * for one confirmed state under StrictMode and AuthProvider", "automatically retries a failed
 * unchanged auth request only once".
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import React, { type ReactNode } from "react";
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
vi.mock("@/app/providers/remote-read/remoteReadLifecycle", () => ({
  startRemoteReads: mocks.start,
  stopRemoteReads: mocks.stop,
}));

import { AuthProvider } from "@/app/providers/auth";
import type { AuthRuntime } from "@/app/providers/auth/authController";
import { RemoteReadBootstrap } from "@/app/providers/remote-read";
import { createAuthSessionStore } from "@/entities/auth-session";
import { useRemoteReadScopeUid } from "@/shared/lib/remote-read";

const ReadScopeProbe = () => <output data-testid="read-scope">{useRemoteReadScopeUid() ?? "signed-out"}</output>;

/**
 * Provides the create harness test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createHarness = (children?: ReactNode) => {
  const authSessionStore = createAuthSessionStore();
  const runtime: AuthRuntime = {
    authSessionStore,
    controller: {
      start: vi.fn(),
      publishAuthenticatedUser: vi.fn(),
      suspendAnonymousBootstrap: vi.fn(() => vi.fn()),
      dispose: vi.fn(),
    },
  };
  const publishUser = (user: User | null) =>
    authSessionStore.publish(
      user == null
        ? { status: "signedOut" }
        : { status: "authenticated", uid: user.uid, isAnonymous: user.isAnonymous, displayName: null }
    );
  render(
    <React.StrictMode>
      <AuthProvider runtime={runtime}>
        <RemoteReadBootstrap>{children}</RemoteReadBootstrap>
      </AuthProvider>
    </React.StrictMode>
  );
  return { publishUser, runtime };
};

describe("RemoteReadBootstrap integration", () => {
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

  it("publishes the confirmed UID to children without waiting for the read transition", () => {
    let finishStart: () => void = () => undefined;
    mocks.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishStart = resolve;
        })
    );
    const { publishUser, runtime } = createHarness(<ReadScopeProbe />);
    expect(screen.getByTestId("read-scope").textContent).toBe("signed-out");

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    expect(screen.getByTestId("read-scope").textContent).toBe("uid-a");
    act(() => finishStart());
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
    expect(console.error).toHaveBeenCalledWith("Remote read transition failed", subscribeError);
    runtime.controller.dispose();
  });
});
