import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuth, useAuthSession } from "./hooks";
import { replaceAuthSession } from "./store";

describe("useAuth [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("keeps the anonymous identity when linking a Google account", () => {
    // Given: Prepare `anonymousSession` and any shared test state below.
    const anonymousSession = {
      status: "authenticated" as const,
      uid: "anonymous-user",
      displayName: null,
      isAnonymous: true,
    };
    replaceAuthSession(anonymousSession);
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useAuth);

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({ uid: "anonymous-user", displayName: null, isAnonymous: true });

    const linkedSession = { ...anonymousSession, displayName: "Test User", isAnonymous: false };
    // When: Exercise `act` with the prepared inputs.
    act(() => replaceAuthSession(linkedSession));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({ uid: "anonymous-user", displayName: "Test User", isAnonymous: false });
  });

  it("clears the linked identity during sign-out and exposes the new anonymous session", () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceAuthSession({
      status: "authenticated",
      uid: "linked-user",
      displayName: "Test User",
      isAnonymous: false,
    });
    const { result } = renderHook(useAuth);

    // When: Exercise `act` with the prepared inputs.
    act(() => replaceAuthSession({ status: "unauthenticated" }));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({ uid: "", displayName: null, isAnonymous: true });

    const anonymousSession = {
      status: "authenticated" as const,
      uid: "new-anonymous-user",
      displayName: null,
      isAnonymous: true,
    };
    // When: Exercise `act` with the prepared inputs.
    act(() => replaceAuthSession(anonymousSession));

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({ uid: "new-anonymous-user", displayName: null, isAnonymous: true });
  });

  it.each([
    { status: "error" as const, source: "auth" as const, error: new Error("authentication failed") },
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt") },
  ])("does not expose an identity while authentication is $status", (session) => {
    // Given: Use this case's inputs and any shared test setup.
    replaceAuthSession(session);
    // When: Exercise `renderHook` with the prepared inputs.
    const { result } = renderHook(useAuth);

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({ uid: "", displayName: null, isAnonymous: true });
  });
});

describe("useAuthSession [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("reads session updates from the global entity store", () => {
    // Given: Use this case's inputs and any shared test setup.
    const { result } = renderHook(useAuthSession);

    // When: Exercise `act` with the prepared inputs.
    act(() =>
      replaceAuthSession({
        status: "authenticated",
        uid: "uid-a",
        isAnonymous: true,
        displayName: null,
      })
    );

    // Then: Verify the expected result in the assertions below.
    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });
});
