/**
 * @file Verifies the "Auth Logout integration" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "waits for local cleanup
 * before bootstrapping the next anonymous UID", "blocks anonymous bootstrap when cleanup fails",
 * "retries a failed sign-out while the authenticated screen remains mounted".
 */

import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { User, UserCredential } from "firebase/auth";
import React, { type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onIdTokenChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  publishUser: undefined as ((user: User | null) => void) | undefined,
  dispatch: vi.fn(),
  startRemoteReads: vi.fn(),
  cleanupUid: vi.fn(),
  clearStudyStore: vi.fn(),
  actualClearStudyStore: undefined as undefined | (() => Promise<void>),
  operations: [] as string[],
  navigate: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: Object.assign(vi.fn(), { credentialFromError: vi.fn() }),
  linkWithPopup: vi.fn(),
  onIdTokenChanged: mocks.onIdTokenChanged,
  signInAnonymously: mocks.signInAnonymously,
  signInWithCredential: vi.fn(),
  signOut: mocks.signOut,
}));
vi.mock("firebase/app", () => ({
  FirebaseError: class FirebaseError extends Error {},
}));
vi.mock("@/app/providers/remote-read/card", () => ({
  startCardSynchronization: () => vi.fn(),
}));
vi.mock("@/app/providers/remote-read/deck", () => ({
  subscribeDecks: (uid: string) => {
    void mocks.startRemoteReads(uid);
    return () => void mocks.cleanupUid(uid);
  },
}));
vi.mock("@/features/study", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/study")>();
  mocks.actualClearStudyStore = actual.clearStudyStore;
  return { ...actual, clearStudyStore: mocks.clearStudyStore };
});
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: false } }),
  setDarkMode: vi.fn(),
  updatePreferences: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/settings/model/hooks/usePreferencesFormState", () => ({
  usePreferencesFormState: (options: Record<string, unknown>) => options,
}));
vi.mock("@/pages/settings/ui/SettingsView", () => ({
  SettingsView: ({ preferencesForm }: { preferencesForm: Record<string, unknown> }) => (
    <>
      {preferencesForm.accountFeedback as ReactNode}
      {typeof preferencesForm.onLogout === "function" && (
        <button type="button" onClick={preferencesForm.onLogout as () => void}>
          Logout
        </button>
      )}
    </>
  ),
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));

import { startAuthSession } from "@/app/providers/auth/lifecycle";
import { startRemoteReadSessionLifecycle } from "@/app/providers/remote-read/lifecycle";
import { getAuthSession, replaceAuthSession, useAuthSession } from "@/entities/auth";
import { signOutCurrentUser } from "@/features/auth/sign-out";
import { SettingsPage } from "@/pages/settings";
import { useStudyStore } from "@/features/study";

let stopRemoteReadSession: (() => void) | undefined;

afterEach(() => {
  stopRemoteReadSession?.();
  stopRemoteReadSession = undefined;
  vi.restoreAllMocks();
});

beforeEach(async () => {
  vi.clearAllMocks();
  replaceAuthSession({ status: "initializing" });
  mocks.auth.currentUser = null;
  mocks.operations.length = 0;
  mocks.onIdTokenChanged.mockImplementation((_auth, onUser) => {
    mocks.publishUser = onUser;
    return vi.fn();
  });
  stopRemoteReadSession = startRemoteReadSessionLifecycle();
  startAuthSession();
  mocks.clearStudyStore.mockImplementation(() => {
    if (!mocks.actualClearStudyStore) throw new Error("Actual study cleanup was not initialized");
    return mocks.actualClearStudyStore();
  });
  if (!mocks.actualClearStudyStore) throw new Error("Actual study cleanup was not initialized");
  await mocks.actualClearStudyStore();
  localStorage.clear();
});

const startStudy = (deckId: string, cardIds: string[]) => {
  const { result, unmount } = renderHook(() => useStudyStore((state) => state.startStudy));
  act(() => result.current(deckId, cardIds));
  unmount();
};

const getStudySessions = () => {
  const { result, unmount } = renderHook(() => useStudyStore((state) => state.sessionsByDeckId));
  const sessions = result.current;
  unmount();
  return sessions;
};

/**
 * Renders the test-only Authenticated Settings component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const AuthenticatedSettings = () =>
  useAuthSession().status === "authenticated" ? <SettingsPage login={vi.fn()} logout={signOutCurrentUser} /> : null;

it("waits for local cleanup before bootstrapping the next anonymous UID", async () => {
  let resolveStudyCleanup: () => void = () => undefined;
  const delayedStudyCleanup = new Promise<void>((resolve) => {
    resolveStudyCleanup = resolve;
  });
  const userA = { uid: "uid-a", isAnonymous: true, providerData: [] } as unknown as User;
  const userB = { uid: "uid-b", isAnonymous: true, providerData: [] } as unknown as User;

  mocks.cleanupUid.mockImplementation((uid: string) => {
    mocks.operations.push(`cleanup:${uid}`);
  });
  mocks.startRemoteReads.mockImplementation(async (uid: string) => {
    mocks.operations.push(`subscribe:${uid}`);
  });
  mocks.clearStudyStore.mockImplementation(async () => {
    mocks.operations.push("clear-study");
    await delayedStudyCleanup;
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

  act(() => mocks.publishUser?.(userA));
  await waitFor(() => expect(mocks.startRemoteReads).toHaveBeenCalledWith("uid-a"));
  mocks.operations.length = 0;

  let pendingLogout!: Promise<void>;
  act(() => {
    pendingLogout = signOutCurrentUser();
  });
  await waitFor(() => expect(mocks.cleanupUid).toHaveBeenCalledOnce());

  expect(mocks.operations).toContain("sign-out");
  expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  expect(mocks.startRemoteReads).not.toHaveBeenCalledWith("uid-b");
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();

  await actAsync(async () => {
    resolveStudyCleanup();
    await pendingLogout;
  });
  await waitFor(() => expect(mocks.startRemoteReads).toHaveBeenCalledWith("uid-b"));

  const clearStudyIndex = mocks.operations.indexOf("clear-study");
  const anonymousStartIndex = mocks.operations.indexOf("anonymous-start");
  const subscribeBIndex = mocks.operations.indexOf("subscribe:uid-b");
  expect(clearStudyIndex).toBeGreaterThanOrEqual(0);
  expect(anonymousStartIndex).toBeGreaterThan(clearStudyIndex);
  expect(subscribeBIndex).toBeGreaterThan(anonymousStartIndex);
});

it("retries a failed sign-out while the authenticated screen remains mounted", async () => {
  const userA = { uid: "retry-uid-a", isAnonymous: false, providerData: [] } as unknown as User;
  const userB = { uid: "retry-uid-b", isAnonymous: true, providerData: [] } as unknown as User;
  const signOutError = new Error("sign out failed");
  const anonymousBootstrap = new Promise<UserCredential>(() => undefined);

  mocks.signOut.mockRejectedValueOnce(signOutError).mockImplementationOnce(async () => mocks.publishUser?.(null));
  mocks.signInAnonymously.mockReturnValue(anonymousBootstrap);
  mocks.clearStudyStore.mockResolvedValue(undefined);

  render(<AuthenticatedSettings />);
  act(() => mocks.publishUser?.(userA));

  fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  expect(mocks.signOut).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument());
  act(() => mocks.publishUser?.(userB));

  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(mocks.signOut).toHaveBeenCalledTimes(2);
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();
});

it("blocks anonymous bootstrap when study cleanup fails", async () => {
  const userA = { uid: "study-uid-a", isAnonymous: false, providerData: [] } as unknown as User;
  const cleanupError = new Error("study storage cleanup failed");

  mocks.signOut.mockImplementation(async () => mocks.publishUser?.(null));
  vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
    throw cleanupError;
  });

  render(
    <React.StrictMode>
      <AuthenticatedSettings />
    </React.StrictMode>
  );
  act(() => mocks.publishUser?.(userA));
  startStudy("old-deck", ["old-card"]);

  fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
  await waitFor(() => expect(getAuthSession()).toEqual({ status: "error", error: cleanupError }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(getStudySessions()).toEqual({});
  expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();
});
