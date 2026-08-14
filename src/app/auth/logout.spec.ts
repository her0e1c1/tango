import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "@/app/auth/logout";
import { clearStudyStore, useStudyStore } from "@/features/study";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn(),
  suspendAnonymousBootstrap: vi.fn(),
  resumeAnonymousBootstrap: vi.fn(),
}));

vi.mock("@/app/providers/auth", () => ({
  suspendAnonymousBootstrap: mocks.suspendAnonymousBootstrap,
}));
vi.mock("@/features/auth/sign-out", () => ({
  signOutCurrentUser: mocks.signOutCurrentUser,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

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

describe("logout", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.suspendAnonymousBootstrap.mockReturnValue(mocks.resumeAnonymousBootstrap);
    await clearStudyStore();
    localStorage.clear();
  });

  it("signs out before clearing study state", async () => {
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
    localStorage.setItem(unrelatedStorageKey, unrelatedStorageValue);
    startStudy("deck", ["card"]);
    expect(localStorage).toHaveLength(2);

    await logout();

    expect(operations).toEqual(["suspend", "sign-out", "resume"]);
    expect(getStudySessions()).toEqual({});
    expect(localStorage.getItem(unrelatedStorageKey)).toBe(unrelatedStorageValue);
    expect(localStorage).toHaveLength(1);
  });

  it("preserves local state when sign-out fails", async () => {
    startStudy("deck", ["card"]);
    mocks.signOutCurrentUser.mockRejectedValue(new Error("sign-out failed"));

    await expect(logout()).rejects.toThrow("sign-out failed");

    expect(getStudySessions()).not.toEqual({});
  });
});
