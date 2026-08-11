/**
 * @file Verifies the "Auth Logout integration" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "waits for logout cleanup
 * before bootstrapping the next anonymous UID", "keeps post-sign-out cleanup failures visible and
 * retries only unfinished cleanup", "hands cleanup feedback across auth after retrying a failed
 * sign-out".
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Auth, User, UserCredential } from "firebase/auth";
import React, { type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn(),
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
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInAnonymously: mocks.signInAnonymously,
  signInWithCredential: vi.fn(),
  signOut: mocks.signOut,
}));
vi.mock("firebase/app", () => ({
  FirebaseError: class FirebaseError extends Error {},
}));
vi.mock("@/store/remoteStore", () => ({
  remoteStore: { getState: () => ({ start: mocks.startRemoteReads, stop: mocks.cleanupUid }) },
}));
vi.mock("@/features/study/state/studyStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/study/state/studyStore")>();
  mocks.actualClearStudyStore = actual.clearStudyStore;
  return { ...actual, clearStudyStore: mocks.clearStudyStore };
});
vi.mock("@/shared/config", () => ({
  useConfig: () => ({ appearance: { darkMode: false } }),
  setDarkMode: vi.fn(),
  updateConfig: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/settings/hooks/useConfigFormState", () => ({
  useConfigFormState: (options: Record<string, unknown>) => options,
}));
vi.mock("@/features/settings/components/templates/ConfigFormTemplate", () => ({
  ConfigFormTemplate: ({ configForm }: { configForm: Record<string, unknown> }) => (
    <>
      {configForm.accountFeedback as ReactNode}
      {typeof configForm.onLogout === "function" && (
        <button type="button" onClick={configForm.onLogout as () => void}>
          Logout
        </button>
      )}
    </>
  ),
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));

import { logout } from "@/app/auth/logout";
import { AuthBootstrap, AuthProvider } from "@/app/providers/auth";
import { useSession } from "@/entities/session";
import { createAuthRuntime } from "@/features/auth";
import { ConfigContainer } from "@/features/settings";
import { studyStore } from "@/features/study/state/studyStore";

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.currentUser = null;
  mocks.publishUser = undefined;
  mocks.operations.length = 0;
  mocks.clearStudyStore.mockImplementation(() => {
    if (!mocks.actualClearStudyStore) throw new Error("Actual study cleanup was not initialized");
    return mocks.actualClearStudyStore();
  });
  studyStore.setState({ sessionsByDeckId: {}, showBackText: false, autoPlay: false, lastSwipe: undefined });
  localStorage.clear();
});

/**
 * Renders the test-only Authenticated Settings component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const AuthenticatedSettings = () =>
  useSession().status === "authenticated" ? <ConfigContainer login={vi.fn()} logout={logout} /> : null;

const createTestRuntime = () =>
  createAuthRuntime({
    auth: mocks.auth as unknown as Auth,
    onAuthStateChanged: mocks.onAuthStateChanged,
    signInAnonymously: mocks.signInAnonymously,
  });

it("waits for logout cleanup before bootstrapping the next anonymous UID", async () => {
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
  mocks.startRemoteReads.mockImplementation(async (uid: string) => {
    mocks.operations.push(`subscribe:${uid}`);
  });
  mocks.clearStudyStore.mockImplementation(async () => {
    mocks.operations.push("clear-study");
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
    <React.StrictMode>
      <AuthProvider>
        <AuthBootstrap />
      </AuthProvider>
    </React.StrictMode>
  );
  act(() => mocks.publishUser?.(userA));
  await waitFor(() => expect(mocks.startRemoteReads).toHaveBeenCalledWith("uid-a"));
  mocks.operations.length = 0;

  let pendingLogout!: Promise<void>;
  act(() => {
    pendingLogout = logout("uid-a");
  });
  await waitFor(() => expect(mocks.cleanupUid).toHaveBeenCalledTimes(2));

  expect(mocks.operations).toContain("sign-out");
  expect(mocks.signInAnonymously).not.toHaveBeenCalled();
  expect(mocks.startRemoteReads).not.toHaveBeenCalledWith("uid-b");
  expect(mocks.clearStudyStore).not.toHaveBeenCalled();

  await actAsync(async () => {
    resolveCleanup();
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

it("keeps post-sign-out cleanup failures visible and retries only unfinished cleanup", async () => {
  const userA = { uid: "feedback-uid-a", isAnonymous: false, providerData: [] } as unknown as User;
  const userB = { uid: "feedback-uid-b", isAnonymous: true, providerData: [] } as unknown as User;
  const firstCleanupError = new Error("cleanup failed");
  const retryCleanupError = new Error("retry cleanup failed");
  let rejectFirstCleanup!: (error: unknown) => void;
  const firstCleanup = new Promise<void>((_resolve, reject) => {
    rejectFirstCleanup = reject;
  });
  const anonymousBootstrap = new Promise<UserCredential>(() => undefined);

  mocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
    mocks.publishUser = onUser;
    return vi.fn();
  });
  let publishedSignedOut = false;
  mocks.signOut.mockImplementation(async () => {
    if (!publishedSignedOut) {
      publishedSignedOut = true;
      mocks.publishUser?.(null);
    }
  });
  mocks.signInAnonymously.mockReturnValue(anonymousBootstrap);
  mocks.cleanupUid
    .mockReturnValueOnce(firstCleanup)
    .mockRejectedValueOnce(retryCleanupError)
    .mockResolvedValueOnce(undefined);
  mocks.clearStudyStore.mockResolvedValue(undefined);

  const runtime = createTestRuntime();
  render(
    <AuthProvider runtime={runtime}>
      <AuthenticatedSettings />
    </AuthProvider>
  );
  act(() => mocks.publishUser?.(userA));
  fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument());
  await actAsync(async () => rejectFirstCleanup(firstCleanupError));
  act(() => mocks.publishUser?.(userB));

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.cleanupUid).toHaveBeenCalledOnce();
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(mocks.cleanupUid).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(mocks.cleanupUid).toHaveBeenCalledTimes(3);
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();
});

it("hands cleanup feedback across auth after retrying a failed sign-out", async () => {
  const userA = { uid: "retry-uid-a", isAnonymous: false, providerData: [] } as unknown as User;
  const userB = { uid: "retry-uid-b", isAnonymous: true, providerData: [] } as unknown as User;
  const signOutError = new Error("sign out failed");
  const cleanupError = new Error("cleanup failed after retry");
  const anonymousBootstrap = new Promise<UserCredential>(() => undefined);

  mocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
    mocks.publishUser = onUser;
    return vi.fn();
  });
  mocks.signOut.mockRejectedValueOnce(signOutError).mockImplementationOnce(async () => mocks.publishUser?.(null));
  mocks.signInAnonymously.mockReturnValue(anonymousBootstrap);
  mocks.cleanupUid.mockRejectedValueOnce(cleanupError).mockResolvedValueOnce(undefined);
  mocks.clearStudyStore.mockResolvedValue(undefined);

  const runtime = createTestRuntime();
  render(
    <AuthProvider runtime={runtime}>
      <AuthenticatedSettings />
    </AuthProvider>
  );
  act(() => mocks.publishUser?.(userA));

  fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.cleanupUid).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument());
  await waitFor(() => expect(mocks.cleanupUid).toHaveBeenCalledOnce());
  await actAsync(async () => Promise.resolve());
  act(() => mocks.publishUser?.(userB));

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(mocks.signOut).toHaveBeenCalledTimes(2);
  expect(mocks.cleanupUid).toHaveBeenCalledTimes(2);
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();
});

it("does not erase a new anonymous study when obsolete logout cleanup is retried", async () => {
  const userA = { uid: "study-uid-a", isAnonymous: false, providerData: [] } as unknown as User;
  const userB = { uid: "study-uid-b", isAnonymous: true, providerData: [] } as unknown as User;
  const cleanupError = new Error("study storage cleanup failed");

  mocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
    mocks.publishUser = onUser;
    return vi.fn();
  });
  mocks.signOut.mockImplementation(async () => mocks.publishUser?.(null));
  mocks.signInAnonymously.mockImplementation(() =>
    Promise.resolve().then(() => {
      mocks.publishUser?.(userB);
      return { user: userB } as UserCredential;
    })
  );
  mocks.cleanupUid.mockResolvedValue(undefined);
  vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
    throw cleanupError;
  });

  const runtime = createTestRuntime();
  render(
    <React.StrictMode>
      <AuthProvider runtime={runtime}>
        <AuthenticatedSettings />
      </AuthProvider>
    </React.StrictMode>
  );
  act(() => mocks.publishUser?.(userA));
  studyStore.getState().startStudy("old-deck", ["old-card"]);

  fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
  expect(studyStore.getState().sessionsByDeckId).toEqual({});

  act(() => studyStore.getState().startStudy("new-deck", ["new-card"]));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(studyStore.getState().sessionsByDeckId).toEqual({
    "new-deck": expect.objectContaining({ deckId: "new-deck", cardOrderIds: ["new-card"] }),
  });
  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.cleanupUid).toHaveBeenCalledOnce();
  expect(mocks.clearStudyStore).toHaveBeenCalledOnce();
});
