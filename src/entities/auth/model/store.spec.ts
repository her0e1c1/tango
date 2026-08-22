import { beforeEach, describe, expect, it } from "vitest";

import { getAuthUser, setAuthUser } from "./store";

describe("authUserStore", () => {
  beforeEach(() => setAuthUser(null));

  it("starts without an authenticated user", () => {
    expect(getAuthUser()).toBeNull();
  });

  it("replaces the current user", () => {
    setAuthUser({
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });

    expect(getAuthUser()).toEqual({
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });
  });

  it("clears the current user", () => {
    setAuthUser({
      uid: "uid-a",
      isAnonymous: false,
      displayName: "Ada",
    });

    setAuthUser(null);

    expect(getAuthUser()).toBeNull();
  });
});
