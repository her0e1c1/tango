import { beforeEach, describe, expect, it } from "vitest";

import { getAuthSession, replaceAuthSession } from "./store";

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
});
