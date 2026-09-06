import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { runAccountAction } from "./runAccountAction";
import { createAccountPageStore } from "../store";

const mocks = vi.hoisted(() => ({
  action: vi.fn<() => Promise<unknown>>(),
  showToast: vi.fn(),
}));

vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("ACCOUNT-02 ACCOUNT-03 runAccountAction", () => {
  beforeEach(() => {
    mocks.action.mockReset();
    mocks.action.mockResolvedValue(undefined);
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("keeps operation pending when requested again before completion", async () => {
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const store = createAccountPageStore();

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
      duplicateOperation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(store.getState().signIn.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(store.getState().signIn.pending).toBe(false);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed in.", tone: "success" });
  });

  it("allows the primary action to retry after a handled failure", async () => {
    const failure = new Error("Action failed");
    const retry = deferred<void>();
    mocks.action.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const store = createAccountPageStore();

    await actAsync(async () => {
      await expect(
        runAccountAction(mocks.action, store, {
          operation: "signIn",
          success: "Signed in.",
          failure: "Unable to sign in.",
        })
      ).resolves.toBeUndefined();
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign in.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });

    expect(store.getState().signIn.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(store.getState().signIn.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("publishes a failure Toast when action rejects after unmount", async () => {
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const store = createAccountPageStore();
    let operation!: Promise<void>;

    act(() => {
      operation = runAccountAction(mocks.action, store, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });
    await actAsync(async () => {
      request.reject(new Error("Late failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign in.", tone: "error" });
    expect(store.getState().signIn.pending).toBe(false);
  });
});
