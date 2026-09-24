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
    const onLocalError = vi.fn();
    let completed = false;
    const result = settleFirestoreWrite(write.promise, onLocalError).then(() => {
      completed = true;
    });
    const failure = new Error("permission-denied");
    await Promise.resolve();
    expect(completed).toBe(false);
    write.reject(failure);
    await expect(result).rejects.toBe(failure);
    expect(onLocalError).not.toHaveBeenCalled();
  });

  it("completes anonymous operations while offline and forwards later local errors", async () => {
    session.currentUser.isAnonymous = true;
    const write = Promise.withResolvers<void>();
    const onLocalError = vi.fn();
    await expect(settleFirestoreWrite(write.promise, onLocalError)).resolves.toBeUndefined();
    expect(onLocalError).not.toHaveBeenCalled();
    const failure = new Error("local persistence failed");
    write.reject(failure);
    await Promise.resolve();
    expect(onLocalError).toHaveBeenCalledExactlyOnceWith(failure);
  });
});
