import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { User, UserCredential } from "firebase/auth";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  publishUser: undefined as ((user: User | null) => void) | undefined,
  dispatch: vi.fn(),
  subscribe: vi.fn(),
  removeFromLocal: vi.fn(),
  cleanupUid: vi.fn(),
  clearStudyStore: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class GoogleAuthProvider {
    static credentialFromError = vi.fn();
  },
  linkWithPopup: vi.fn(),
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInAnonymously: mocks.signInAnonymously,
  signInWithCredential: vi.fn(),
  signOut: mocks.signOut,
}));
vi.mock("firebase/app", () => ({
  FirebaseError: class FirebaseError extends Error {},
}));
vi.mock("react-redux", () => ({ useDispatch: () => mocks.dispatch }));
vi.mock("@/action", () => ({
  event: {
    subscribe: mocks.subscribe,
    removeFromLocal: mocks.removeFromLocal,
  },
}));
vi.mock("@/action/firestore", () => ({}));
vi.mock("@/query/cleanup", () => ({ cleanupFirestoreUid: mocks.cleanupUid }));
vi.mock("@/features/study/state/studyStore", () => ({ clearStudyStore: mocks.clearStudyStore }));
vi.mock("@/lib/realtimeSubscriptions", () => ({
  registerSubscription: vi.fn(),
  stopSubscriptions: vi.fn(),
}));

import * as type from "@/action/type";
import { logout } from "@/action/event";
import { AuthBootstrap } from "@/auth/AuthBootstrap";
import { AuthProvider } from "@/auth/AuthContext";

afterEach(() => cleanup());

it("waits for logout cleanup and local clear before bootstrapping the next anonymous UID", async () => {
  let resolveCleanup: () => void = () => undefined;
  const delayedCleanup = new Promise<void>((resolve) => {
    resolveCleanup = resolve;
  });
  const userA = { uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User;
  const userB = { uid: "uid-b", isAnonymous: true, providerData: [] } as unknown as User;

  mocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
    mocks.publishUser = onUser;
    return vi.fn();
  });
  mocks.cleanupUid.mockImplementation(async (uid: string) => {
    mocks.operations.push(`cleanup:${uid}`);
    await delayedCleanup;
  });
  mocks.subscribe.mockImplementation(async (uid: string) => {
    mocks.operations.push(`subscribe:${uid}`);
  });
  mocks.removeFromLocal.mockResolvedValue(undefined);
  mocks.clearStudyStore.mockImplementation(async () => {
    mocks.operations.push("clear-study");
  });
  mocks.dispatch.mockImplementation((value: unknown) => {
    if (typeof value === "object" && value != null && "type" in value) {
      if (value.type === "CONFIG_UPDATE") {
        const action = value as ReturnType<typeof type.configUpdate>;
        mocks.operations.push(`sync:${action.payload.config.uid}`);
      } else if (value.type === "CLEAR_ALL") {
        mocks.operations.push("clear-redux");
      }
    }
    return value;
  });
  mocks.signOut.mockImplementation(async () => {
    mocks.operations.push("sign-out");
    mocks.publishUser?.(null);
  });
  mocks.signInAnonymously.mockImplementation(() => {
    mocks.operations.push("anonymous-start");
    return Promise.resolve().then(() => {
      mocks.publishUser?.(userB);
      return { user: userB } as UserCredential;
    });
  });

  render(
    <StrictMode>
      <AuthProvider>
        <AuthBootstrap />
      </AuthProvider>
    </StrictMode>
  );
  act(() => mocks.publishUser?.(userA));
  await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledWith("uid-a"));
  await waitFor(() => expect(mocks.removeFromLocal).toHaveBeenCalledTimes(1));
  mocks.operations.length = 0;

  let pendingLogout!: Promise<void>;
  act(() => {
    pendingLogout = logout("uid-a")(mocks.dispatch, vi.fn(), undefined);
  });
  await waitFor(() => expect(mocks.cleanupUid).toHaveBeenCalledTimes(2));

  expect(mocks.operations).toContain("sign-out");
  expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  expect(mocks.subscribe).not.toHaveBeenCalledWith("uid-b");
  expect(mocks.operations).not.toContain("sync:uid-b");
  expect(mocks.clearStudyStore).not.toHaveBeenCalled();
  expect(mocks.operations).not.toContain("clear-redux");

  await act(async () => {
    resolveCleanup();
    await pendingLogout;
  });
  await waitFor(() => expect(mocks.subscribe).toHaveBeenCalledWith("uid-b"));

  const clearStudyIndex = mocks.operations.indexOf("clear-study");
  const clearReduxIndex = mocks.operations.indexOf("clear-redux");
  const anonymousStartIndex = mocks.operations.indexOf("anonymous-start");
  const syncBIndex = mocks.operations.indexOf("sync:uid-b");
  const subscribeBIndex = mocks.operations.indexOf("subscribe:uid-b");
  expect(clearStudyIndex).toBeGreaterThanOrEqual(0);
  expect(clearReduxIndex).toBeGreaterThan(clearStudyIndex);
  expect(anonymousStartIndex).toBeGreaterThan(clearReduxIndex);
  expect(syncBIndex).toBeGreaterThan(anonymousStartIndex);
  expect(subscribeBIndex).toBeGreaterThan(syncBIndex);
});
