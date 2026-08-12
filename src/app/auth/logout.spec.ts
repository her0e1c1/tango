import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "@/app/auth/logout";
import { STUDY_STORAGE_KEY, studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  stopRemoteReads: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  signOutCurrentUser: mocks.signOutCurrentUser,
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("@/app/providers/remote-read/remoteReadLifecycle", () => ({
  stopRemoteReads: mocks.stopRemoteReads,
}));

describe("logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.suspendAnonymousBootstrap.mockReturnValue(mocks.resumeAnonymousBootstrap);
    localStorage.clear();
    studyStore.setState({ sessionsByDeckId: {}, showBackText: false, autoPlay: false, lastSwipe: undefined });
  });

  it("signs out before clearing remote and study state", async () => {
    const operations: string[] = [];
    mocks.suspendAnonymousBootstrap.mockImplementation(() => {
      operations.push("suspend");
      return () => operations.push("resume");
    });
    mocks.signOutCurrentUser.mockImplementation(async () => {
      operations.push("sign-out");
    });
    mocks.stopRemoteReads.mockImplementation(() => {
      operations.push("stop-remote");
    });
    studyStore.getState().startStudy("deck", ["card"]);

    await logout("uid-a");

    expect(operations).toEqual(["suspend", "sign-out", "stop-remote", "resume"]);
    expect(studyStore.getState().sessionsByDeckId).toEqual({});
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("preserves local state when sign-out fails", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    mocks.signOutCurrentUser.mockRejectedValue(new Error("sign-out failed"));

    await expect(logout("uid-a")).rejects.toThrow("sign-out failed");

    expect(mocks.stopRemoteReads).not.toHaveBeenCalled();
    expect(studyStore.getState().sessionsByDeckId).not.toEqual({});
  });

  it("clears study state after remote cleanup fails", async () => {
    studyStore.getState().startStudy("deck", ["card"]);
    mocks.stopRemoteReads.mockImplementation(() => {
      throw new Error("cleanup failed");
    });

    await expect(logout("uid-a")).rejects.toThrow("cleanup failed");

    expect(studyStore.getState().sessionsByDeckId).toEqual({});
  });
});
