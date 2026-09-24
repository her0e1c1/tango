import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getAuthSession, getAuthUid, replaceAuthSession, useAuth, useAuthSession } from "./store";

describe("authSessionStore [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04] [DECK-MANAGEMENT-07]", () => {
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

  it("returns the authenticated UID and keeps it when an anonymous account is linked", () => {
    const session = { status: "authenticated" as const, uid: "uid-a", isAnonymous: true, displayName: null };
    replaceAuthSession(session);
    expect(getAuthUid()).toBe("uid-a");

    replaceAuthSession({ ...session, isAnonymous: false });
    expect(getAuthUid()).toBe("uid-a");
  });

  it.each([
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt-a") },
    { status: "error" as const, error: new Error("authentication failed") },
  ])("returns an empty UID when the session is $status", (session) => {
    replaceAuthSession(session);
    expect(getAuthUid()).toBe("");
  });

  it("updates the complete session hook", () => {
    const { result } = renderHook(useAuthSession);

    act(() =>
      replaceAuthSession({
        status: "authenticated",
        uid: "uid-a",
        isAnonymous: true,
        displayName: null,
      })
    );

    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });

  it("keeps the anonymous identity when linking a Google account", () => {
    const anonymousSession = {
      status: "authenticated" as const,
      uid: "anonymous-user",
      displayName: null,
      isAnonymous: true,
    };
    replaceAuthSession(anonymousSession);
    const { result } = renderHook(useAuth);

    expect(result.current).toEqual({ uid: "anonymous-user", displayName: null, isAnonymous: true });

    act(() => replaceAuthSession({ ...anonymousSession, displayName: "Test User", isAnonymous: false }));

    expect(result.current).toEqual({ uid: "anonymous-user", displayName: "Test User", isAnonymous: false });
  });
});
