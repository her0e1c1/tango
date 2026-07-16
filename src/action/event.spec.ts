import { beforeEach, describe, expect, it, vi } from "vitest";
import { linkWithPopup, signOut } from "firebase/auth";

import * as action from "@/action";
import { STUDY_STORAGE_KEY, studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as object | null },
  publishAuthenticatedUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  cleanupFirestoreUid: vi.fn(),
}));

vi.mock("firebase/auth");
vi.mock("firebase/firestore");
vi.mock("./firestore");
vi.mock("@/firebase", () => ({ auth: mocks.auth }));
vi.mock("@/auth/AuthContext", () => ({
  publishAuthenticatedUser: mocks.publishAuthenticatedUser,
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("@/query/cleanup", () => ({ cleanupFirestoreUid: mocks.cleanupFirestoreUid }));

describe("event action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.suspendAnonymousBootstrap.mockReturnValue(mocks.resumeAnonymousBootstrap);
    mocks.auth.currentUser = null;
    localStorage.clear();
    studyStore.setState({ session: null, showBackText: false, autoPlay: false, lastSwipe: undefined });
  });

  it("signs out before clearing Query and study state while preserving Redux state", async () => {
    const operations: string[] = [];
    mocks.suspendAnonymousBootstrap.mockImplementation(() => {
      operations.push("suspend");
      return () => operations.push("resume");
    });
    vi.mocked(signOut).mockImplementation(async () => {
      operations.push("sign-out");
    });
    mocks.cleanupFirestoreUid.mockImplementation(async () => {
      operations.push("cleanup-query");
    });
    studyStore.getState().startStudy("deck", ["card"]);
    const dispatch = vi.fn();

    await action.event.logout("uid-a")(dispatch, vi.fn(), undefined);

    expect(operations).toEqual(["suspend", "sign-out", "cleanup-query", "resume"]);
    expect(dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).toBeNull();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("preserves local state when sign-out fails", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    vi.mocked(signOut).mockRejectedValue(new Error("sign-out failed"));
    const dispatch = vi.fn();

    await expect(action.event.logout("uid-a")(dispatch, vi.fn(), undefined)).rejects.toThrow("sign-out failed");

    expect(mocks.cleanupFirestoreUid).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(studyStore.getState().session).not.toBeNull();
  });

  it("clears study state but preserves Redux state after a Query cleanup failure", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    mocks.cleanupFirestoreUid.mockRejectedValue(new Error("cleanup failed"));
    const dispatch = vi.fn();

    await expect(action.event.logout("uid-a")(dispatch, vi.fn(), undefined)).rejects.toThrow("cleanup failed");

    expect(studyStore.getState().session).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("publishes a linked Firebase user without persisting identity", async () => {
    const user = { uid: "uid-a", isAnonymous: false, providerData: [] };
    mocks.auth.currentUser = {};
    vi.mocked(linkWithPopup).mockResolvedValue({ user } as never);
    const dispatch = vi.fn();

    await action.event.loginGoogle()(dispatch, vi.fn(), undefined);

    expect(mocks.publishAuthenticatedUser).toHaveBeenCalledWith(user);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
