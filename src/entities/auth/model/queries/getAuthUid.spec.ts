import { beforeEach, describe, expect, it } from "vitest";

import { replaceAuthSession } from "../actions/replaceAuthSession";
import { getAuthUid } from "./getAuthUid";

describe("getAuthUid [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns the authenticated user UID", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: true,
      displayName: null,
    });

    expect(getAuthUid()).toBe("uid-a");
  });

  it.each([
    { status: "initializing" as const },
    { status: "unauthenticated" as const },
    { status: "authenticating" as const, attemptId: Symbol("attempt-a") },
    { status: "error" as const, error: new Error("authentication failed") },
  ])("returns an empty string when the session is $status", (session) => {
    replaceAuthSession(session);

    expect(getAuthUid()).toBe("");
  });
});
