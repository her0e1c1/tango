import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthSession, useFirebaseUid, useGoogleAccount, useGoogleAccountUid } from "./hooks";
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
        googleAccount: null,
      })
    );

    expect(result.current).toEqual({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      googleAccount: null,
    });
  });
});

describe("useFirebaseUid", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns the authenticated user UID", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      googleAccount: null,
    });

    const { result } = renderHook(useFirebaseUid);

    expect(result.current).toBe("uid-a");
  });

  it.each([
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt-a") },
    { status: "error" as const, error: new Error("authentication failed") },
  ])("returns an empty string when the session is $status", (session) => {
    replaceAuthSession(session);

    const { result } = renderHook(useFirebaseUid);

    expect(result.current).toBe("");
  });
});

describe("useGoogleAccount", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns a linked account", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      googleAccount: { displayName: "Test User" },
    });

    const { result } = renderHook(useGoogleAccount);

    expect(result.current).toEqual({ uid: "uid-a", displayName: "Test User" });
  });

  it("does not infer Google access from a non-anonymous Firebase user", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "password-user",
      isAnonymous: false,
      googleAccount: null,
    });

    const { result } = renderHook(useGoogleAccount);

    expect(result.current).toBeUndefined();
  });

  it("returns no account before authentication", () => {
    const { result } = renderHook(useGoogleAccount);

    expect(result.current).toBeUndefined();
  });
});

describe("useGoogleAccountUid", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns the Firebase uid only when Google is linked", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      googleAccount: { displayName: null },
    });

    const { result } = renderHook(useGoogleAccountUid);

    expect(result.current).toBe("uid-a");
  });

  it("returns an empty string for a Firebase user without Google", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      googleAccount: null,
    });

    const { result } = renderHook(useGoogleAccountUid);

    expect(result.current).toBe("");
  });
});
