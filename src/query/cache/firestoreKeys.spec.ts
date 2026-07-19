import { describe, expect, it } from "vitest";
import { firestoreKeys } from "@/query/cache/firestoreKeys";

describe("firestoreKeys", () => {
  const uid = "user-123";

  it("creates the UID prefix used to target one user's cache", () => {
    expect(firestoreKeys.uid(uid)).toEqual(["firestore", uid]);
  });

  it("creates exact UID-scoped collection keys", () => {
    expect(firestoreKeys.decks(uid)).toEqual(["firestore", uid, "decks"]);
    expect(firestoreKeys.cards(uid)).toEqual(["firestore", uid, "cards"]);
  });

  it("returns frozen keys", () => {
    expect(Object.isFrozen(firestoreKeys.uid(uid))).toBe(true);
    expect(Object.isFrozen(firestoreKeys.decks(uid))).toBe(true);
    expect(Object.isFrozen(firestoreKeys.cards(uid))).toBe(true);
  });
});
