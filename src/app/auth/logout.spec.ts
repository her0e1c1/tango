import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "@/app/auth/logout";
import { studyStore } from "@/features/study";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
  stopRemoteReads: vi.fn(),
}));

vi.mock("@/app/providers/auth", () => ({
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("@/features/auth/sign-out", () => ({
  signOutCurrentUser: mocks.signOutCurrentUser,
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
    const unrelatedStorageKey = "unrelated-preference";
    const unrelatedStorageValue = "preserve-me";
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
    localStorage.setItem(unrelatedStorageKey, unrelatedStorageValue);
    studyStore.getState().startStudy("deck", ["card"]);
    expect(localStorage).toHaveLength(2);

    await logout("uid-a");

    expect(operations).toEqual(["suspend", "sign-out", "stop-remote", "resume"]);
    expect(studyStore.getState().sessionsByDeckId).toEqual({});
    expect(localStorage.getItem(unrelatedStorageKey)).toBe(unrelatedStorageValue);
    expect(localStorage).toHaveLength(1);
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
