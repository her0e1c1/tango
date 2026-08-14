import { act, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInAnonymously: vi.fn(),
  startCards: vi.fn(),
  stopCards: vi.fn(),
  stopDecks: vi.fn(),
  clearDecks: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: Object.assign(vi.fn(), { credentialFromError: vi.fn() }),
  linkWithPopup: vi.fn(),
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInAnonymously: mocks.signInAnonymously,
  signInWithCredential: vi.fn(),
}));
vi.mock("@/features/card/read", () => ({
  startCardReads: mocks.startCards,
  stopCardReads: mocks.stopCards,
}));
vi.mock("@/entities/deck", () => ({ clearDecks: mocks.clearDecks }));
vi.mock("./deck", () => ({
  subscribeDecks: vi.fn(() => mocks.stopDecks),
}));

import { AuthProvider } from "@/app/providers/auth";
import type { AuthRuntime } from "@/app/providers/auth/authController";
import { RemoteReadProvider } from "@/app/providers/remote-read";
import { createAuthSessionStore } from "@/entities/auth-session";

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
        <RemoteReadProvider>{children}</RemoteReadProvider>
      </AuthProvider>
    </React.StrictMode>
  );
  return { publishUser };
};

describe("RemoteReadProvider integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts reads and renders children", async () => {
    const { publishUser } = createHarness(<div>content</div>);

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("stops the previous UID before starting its replacement", async () => {
    const { publishUser } = createHarness();
    const userA = { uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User;
    const userB = { uid: "uid-b", isAnonymous: true, providerData: [] } as unknown as User;

    act(() => publishUser(userA));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    act(() => publishUser(userB));

    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-b"));
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledOnce();
    expect(mocks.clearDecks).toHaveBeenCalled();
  });
});
