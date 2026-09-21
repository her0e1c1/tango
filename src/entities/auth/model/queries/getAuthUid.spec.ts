import { beforeEach, describe, expect, it } from "vitest";

import { replaceAuthSession } from "../actions/replaceAuthSession";
import { getAuthUid } from "./getAuthUid";

describe("getAuthUid [ACCOUNT-01] [ACCOUNT-03] [ACCOUNT-04] [DECK-MANAGEMENT-07]", () => {
  beforeEach(() => replaceAuthSession({ status: "initializing" }));

  it("returns the linked account UID", () => {
    replaceAuthSession({
      status: "authenticated",
      uid: "uid-a",
      isAnonymous: false,
      displayName: null,
    });

    expect(getAuthUid()).toBe("uid-a");
  });

  it("preserves the same persistence identity when an anonymous account is linked", () => {
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
  ])("returns an empty string when the session is $status", (session) => {
    replaceAuthSession(session);

    expect(getAuthUid()).toBe("");
  });
});
