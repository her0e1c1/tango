import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthSession, useAuthUid } from "./hooks";
import { replaceAuthSession } from "./store";

describe("useAuthSession", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("reads session updates from the global entity store", () => {
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
});

describe("useAuthUid", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns the authenticated user UID", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });

    const { result } = renderHook(useAuthUid);

    expect(result.current).toBe("uid-a");
  });

  it.each([
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt-a") },
    { status: "error" as const, error: new Error("authentication failed") },
  ])("returns an empty string when the session is $status", (session) => {
    replaceAuthSession(session);

    const { result } = renderHook(useAuthUid);

    expect(result.current).toBe("");
  });
});
