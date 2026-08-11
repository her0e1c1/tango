/**
 * @file Verifies the "event action" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "signs out before clearing
 * Query and study state", "preserves local state when sign-out fails", "clears study state after a
 * Query cleanup failure".
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential, signOut } from "firebase/auth";

import * as action from "@/action";
import { STUDY_STORAGE_KEY, studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as object | null },
  publishAuthenticatedUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  stopRemoteReads: vi.fn(),
}));

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("./firestore");
vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("@/auth/AuthContext", () => ({
  publishAuthenticatedUser: mocks.publishAuthenticatedUser,
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("@/store/remoteStore", () => ({
  remoteStore: { getState: () => ({ stop: mocks.stopRemoteReads }) },
}));

describe("event action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.suspendAnonymousBootstrap.mockReturnValue(mocks.resumeAnonymousBootstrap);
    mocks.auth.currentUser = null;
    localStorage.clear();
    studyStore.setState({ sessionsByDeckId: {}, showBackText: false, autoPlay: false, lastSwipe: undefined });
  });

  it("signs out before clearing Query and study state", async () => {
    const operations: string[] = [];
    mocks.suspendAnonymousBootstrap.mockImplementation(() => {
      operations.push("suspend");
      return () => operations.push("resume");
    });
    vi.mocked(signOut).mockImplementation(async () => {
      operations.push("sign-out");
    });
    mocks.stopRemoteReads.mockImplementation(() => {
      operations.push("stop-remote");
    });
    studyStore.getState().startStudy("deck", ["card"]);
    await action.event.logout("uid-a");

    expect(operations).toEqual(["suspend", "sign-out", "stop-remote", "resume"]);
    expect(studyStore.getState().sessionsByDeckId).toEqual({});
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("preserves local state when sign-out fails", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    vi.mocked(signOut).mockRejectedValue(new Error("sign-out failed"));
    await expect(action.event.logout("uid-a")).rejects.toThrow("sign-out failed");

    expect(mocks.stopRemoteReads).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId).not.toEqual({});
  });

  it("clears study state after remote cleanup fails", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    mocks.stopRemoteReads.mockImplementation(() => {
      throw new Error("cleanup failed");
    });
    await expect(action.event.logout("uid-a")).rejects.toThrow("cleanup failed");

    expect(studyStore.getState().sessionsByDeckId).toEqual({});
  });

  it("publishes a linked Firebase user without persisting identity", async () => {
    const user = { uid: "uid-a", isAnonymous: false, providerData: [] };
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockResolvedValue({ user } as never);
    await action.event.loginGoogle();

    expect(mocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
  });

  it("rejects Google login when no anonymous user exists", async () => {
    await expect(action.event.loginGoogle()).rejects.toThrow("Anonymous user is required before Google sign-in");

    expect(linkWithPopup).not.toHaveBeenCalled();
    expect(mocks.publishAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("preserves non-Firebase Google linking errors", async () => {
    const error = new Error("popup failed");
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockRejectedValue(error);

    await expect(action.event.loginGoogle()).rejects.toBe(error);
    expect(mocks.publishAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("preserves Firebase Google linking errors without a credential", async () => {
    const error = new FirebaseError("auth/popup-closed-by-user", "Popup closed");
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(null);

    await expect(action.event.loginGoogle()).rejects.toBe(error);
    expect(mocks.publishAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("recovers a Google credential and publishes the authenticated user", async () => {
    const error = new FirebaseError("auth/credential-already-in-use", "Credential already in use");
    const credential = { providerId: "google.com" };
    const user = { uid: "uid-a", isAnonymous: false, providerData: [] };
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockRejectedValue(error);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue(credential as never);
    vi.mocked(signInWithCredential).mockResolvedValue({ user } as never);

    await action.event.loginGoogle();

    expect(signInWithCredential).toHaveBeenCalledWith(mocks.auth, credential);
    expect(mocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
  });

  it("propagates Google credential recovery failures", async () => {
    const linkingError = new FirebaseError("auth/credential-already-in-use", "Credential already in use");
    const recoveryError = new Error("credential recovery failed");
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockRejectedValue(linkingError);
    vi.mocked(GoogleAuthProvider.credentialFromError).mockReturnValue({} as never);
    vi.mocked(signInWithCredential).mockRejectedValue(recoveryError);

    await expect(action.event.loginGoogle()).rejects.toBe(recoveryError);
    expect(mocks.publishAuthenticatedUser).not.toHaveBeenCalled();
  });
});
