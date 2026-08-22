import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAuthAccount, useAuthUid } from "./hooks";
import { setAuthUser } from "./store";

describe("useAuthUid", () => {
  beforeEach(() => setAuthUser(null));

  it("returns the authenticated user UID", () => {
    setAuthUser({
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });

    const { result } = renderHook(useAuthUid);

    expect(result.current).toBe("uid-a");
  });

  it("returns an empty string without an authenticated user", () => {
    const { result } = renderHook(useAuthUid);

    expect(result.current).toBe("");
  });
});

describe("useAuthAccount", () => {
  beforeEach(() => setAuthUser(null));

  it("returns a linked account", () => {
    setAuthUser({
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Test User",
    });

    const { result } = renderHook(useAuthAccount);

    expect(result.current).toEqual({ uid: "uid-a", displayName: "Test User" });
  });

  it("does not return an anonymous user as an account", () => {
    setAuthUser({
      uid: "anonymous-uid",
      isAnonymous: true,
      displayName: null,
    });

    const { result } = renderHook(useAuthAccount);

    expect(result.current).toBeUndefined();
  });

  it("reacts when the authenticated identity changes", () => {
    const { result } = renderHook(useAuthAccount);

    act(() => {
      setAuthUser({
        uid: "uid-a",
        isAnonymous: false,
        displayName: "Ada",
      });
    });

    expect(result.current).toEqual({ uid: "uid-a", displayName: "Ada" });

    act(() => setAuthUser(null));

    expect(result.current).toBeUndefined();
  });
});
