import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { replaceAuthSession } from "../actions/replaceAuthSession";
import { useAuth } from "./useAuth";

describe("useAuth [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

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

    const linkedSession = { ...anonymousSession, displayName: "Test User", isAnonymous: false };
    act(() => replaceAuthSession(linkedSession));

    expect(result.current).toEqual({ uid: "anonymous-user", displayName: "Test User", isAnonymous: false });
  });

  it("clears the linked identity during sign-out and exposes the new anonymous session", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "linked-user",
      displayName: "Test User",
      isAnonymous: false,
    });
    const { result } = renderHook(useAuth);

    act(() => replaceAuthSession({ status: "unauthenticated" }));

    expect(result.current).toEqual({ uid: "", displayName: null, isAnonymous: true });

    const anonymousSession = {
      status: "authenticated" as const,
      uid: "new-anonymous-user",
      displayName: null,
      isAnonymous: true,
    };
    act(() => replaceAuthSession(anonymousSession));

    expect(result.current).toEqual({ uid: "new-anonymous-user", displayName: null, isAnonymous: true });
  });

  it.each([
    { status: "error" as const, error: new Error("authentication failed") },
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt") },
  ])("does not expose an identity while authentication is $status", (session) => {
    replaceAuthSession(session);
    const { result } = renderHook(useAuth);

    expect(result.current).toEqual({ uid: "", displayName: null, isAnonymous: true });
  });
});
