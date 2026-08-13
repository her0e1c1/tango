import { act, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const createHarness = (children?: ReactNode) => {
  const authSessionStore = createAuthSessionStore();
  const runtime: AuthRuntime = {
    authSessionStore,
    start: vi.fn(),
    publishAuthenticatedUser: vi.fn(),
    suspendAnonymousBootstrap: vi.fn(() => vi.fn()),
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
  return { publishUser };
};

describe("RemoteReadBootstrap integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.start.mockResolvedValue(undefined);
  });

  it("starts remote reads once for one confirmed state under StrictMode and AuthProvider", async () => {
    const { publishUser } = createHarness();

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(1));
    expect(mocks.start).toHaveBeenCalledWith("uid-a");
  });

  it("publishes the confirmed UID to children without waiting for the read transition", () => {
    let finishStart: () => void = () => undefined;
    mocks.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishStart = resolve;
        })
    );
    const { publishUser } = createHarness(<ReadScopeProbe />);
    expect(screen.getByTestId("read-scope").textContent).toBe("signed-out");

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    expect(screen.getByTestId("read-scope").textContent).toBe("uid-a");
    act(() => finishStart());
  });

  it("stops the previous UID before starting its replacement", async () => {
    const { publishUser } = createHarness();
    const userA = { uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User;
    const userB = { uid: "uid-b", isAnonymous: true, providerData: [] } as unknown as User;

    act(() => publishUser(userA));
    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith("uid-a"));
    act(() => publishUser(userB));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith("uid-b"));
    expect(mocks.stop).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stop.mock.invocationCallOrder[0]).toBeLessThan(mocks.start.mock.invocationCallOrder[1] ?? 0);
  });
});
