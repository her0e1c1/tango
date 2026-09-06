import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { replaceAuthSession } from "../actions/replaceAuthSession";
import { useAuthAccount } from "./useAuthAccount";

describe("useAuthAccount [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns a linked account", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Test User",
    });

    const { result } = renderHook(useAuthAccount);

    expect(result.current).toEqual({ uid: "uid-a", displayName: "Test User" });
  });

  it("does not return an anonymous user as an account", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "anonymous-uid",
      isAnonymous: true,
      displayName: null,
    });

    const { result } = renderHook(useAuthAccount);

    expect(result.current).toBeUndefined();
  });

  it("returns no account before authentication", () => {
    const { result } = renderHook(useAuthAccount);

    expect(result.current).toBeUndefined();
  });
});
