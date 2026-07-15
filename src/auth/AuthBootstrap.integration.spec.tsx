import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { Auth, User, UserCredential } from "firebase/auth";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInAnonymously: vi.fn(),
  dispatch: vi.fn((value: unknown) => value),
  subscribe: vi.fn(),
  removeFromLocal: vi.fn(),
  cleanupUid: vi.fn(),
}));

vi.mock("@/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInAnonymously: mocks.signInAnonymously,
}));
vi.mock("react-redux", () => ({ useDispatch: () => mocks.dispatch }));
vi.mock("@/action", () => ({
  event: {
    subscribe: mocks.subscribe,
    removeFromLocal: mocks.removeFromLocal,
  },
}));
vi.mock("@/query/cleanup", () => ({ cleanupFirestoreUid: mocks.cleanupUid }));

import { AuthBootstrap } from "@/auth/AuthBootstrap";
import { AuthProvider, createAuthStore } from "@/auth/AuthContext";

const createHarness = () => {
  let publishUser: (user: User | null) => void = () => undefined;
  const store = createAuthStore({
    auth: {} as Auth,
    onAuthStateChanged: vi.fn((_auth, onUser) => {
      publishUser = onUser;
      return vi.fn();
    }),
    signInAnonymously: vi.fn<() => Promise<UserCredential>>(),
  });
  render(
    <StrictMode>
      <AuthProvider store={store}>
        <AuthBootstrap />
      </AuthProvider>
    </StrictMode>
  );
  return { publishUser, store };
};

describe("AuthBootstrap integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dispatch.mockImplementation((value: unknown) => value);
    mocks.subscribe.mockResolvedValue(undefined);
    mocks.removeFromLocal.mockResolvedValue(undefined);
    mocks.cleanupUid.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("subscribes once for one confirmed state under StrictMode and AuthProvider", async () => {
    const { publishUser, store } = createHarness();

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledTimes(1));
    expect(mocks.subscribe).toHaveBeenCalledWith("uid-a");
    store.dispose();
  });

  it("automatically retries a failed unchanged auth request only once", async () => {
    const subscribeError = new Error("subscribe failed");
    mocks.subscribe.mockRejectedValue(subscribeError);
    const { publishUser, store } = createHarness();

    act(() => publishUser({ uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User));

    await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    expect(mocks.subscribe).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith("Auth transition failed", subscribeError);
    store.dispose();
  });
});
