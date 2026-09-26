import { beforeEach, describe, expect, it, vi } from "vitest";
import { settleFirestoreWrite } from "./settleFirestoreWrite";

const session = vi.hoisted(() => ({ currentUser: { isAnonymous: false } }));
vi.mock("@/shared/firebase", () => ({ auth: session }));

describe("Firestore write completion [PERSISTENCE-05] [CARD-MANAGEMENT-04]", () => {
  beforeEach(() => {
    session.currentUser.isAnonymous = false;
  });

  it("waits for linked-user writes and rejects with the original failure", async () => {
    const write = Promise.withResolvers<void>();
    let completed = false;
    const result = settleFirestoreWrite(write.promise).then(() => {
      completed = true;
    });
    const failure = new Error("permission-denied");
    await Promise.resolve();
    expect(completed).toBe(false);
    write.reject(failure);
    await expect(result).rejects.toBe(failure);
  });

  it("completes anonymous writes without a callback and reports later errors", async () => {
    session.currentUser.isAnonymous = true;
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const write = Promise.withResolvers<void>();
    try {
      await expect(settleFirestoreWrite(write.promise)).resolves.toBeUndefined();
      const error = new Error("local persistence failed");
      write.reject(error);
      await Promise.resolve();
      expect(report).toHaveBeenCalledExactlyOnceWith(error);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
