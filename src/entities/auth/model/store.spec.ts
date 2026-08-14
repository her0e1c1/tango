import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthSession, replaceAuthSession, subscribeAuthSession } from "./store";

describe("authSessionStore", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("starts without an identity", () => {
    expect(getAuthSession()).toEqual({ status: "initializing" });
    expect("uid" in getAuthSession()).toBe(false);
  });

  it("replaces the current session", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });

    expect(getAuthSession()).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });

  it("represents anonymous authentication without an SDK credential", () => {
    const attemptId = Symbol("attempt-a");
    replaceAuthSession({ status: "authenticating", attemptId });

    expect(getAuthSession()).toEqual({ status: "authenticating", attemptId });
  });

  it("notifies App lifecycles when the session changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthSession(listener);

    replaceAuthSession({ status: "unauthenticated" });

    expect(listener).toHaveBeenCalledWith({ status: "unauthenticated" }, { status: "initializing" });
    unsubscribe();
  });
});
