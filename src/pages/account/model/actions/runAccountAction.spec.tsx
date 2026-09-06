import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

import { runAccountAction } from "./runAccountAction";
import { useAccountPageState } from "../useAccountPageState";

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
    const { result } = renderHook(useAccountPageState);

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = runAccountAction(mocks.action, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
      duplicateOperation = runAccountAction(mocks.action, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(result.current.signIn.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.signIn.pending).toBe(false);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed in.", tone: "success" });
  });

  it("allows the primary action to retry after a handled failure", async () => {
    const failure = new Error("Action failed");
    const retry = deferred<void>();
    mocks.action.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(useAccountPageState);

    await actAsync(async () => {
      await expect(
        runAccountAction(mocks.action, {
          operation: "signIn",
          success: "Signed in.",
          failure: "Unable to sign in.",
        })
      ).resolves.toBeUndefined();
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign in.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = runAccountAction(mocks.action, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });

    expect(result.current.signIn.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(result.current.signIn.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("does not show a failure Toast when action rejects after unmount", async () => {
    const request = deferred<void>();
    mocks.action.mockReturnValue(request.promise);
    const { unmount } = renderHook(useAccountPageState);
    let operation!: Promise<void>;

    act(() => {
      operation = runAccountAction(mocks.action, {
        operation: "signIn",
        success: "Signed in.",
        failure: "Unable to sign in.",
      });
    });
    unmount();
    await actAsync(async () => {
      request.reject(new Error("Late failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(showToast).not.toHaveBeenCalled();
  });

  it.each(["success", "failure"])("keeps a new visit pending after an old %s", async (outcome) => {
    const oldRequest = deferred<void>();
    const newRequest = deferred<void>();
    mocks.action.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const { unmount } = renderHook(useAccountPageState);
    const options = { operation: "signIn", success: "Signed in.", failure: "Unable to sign in." } as const;
    let oldOperation!: Promise<void>;
    act(() => {
      oldOperation = runAccountAction(mocks.action, options);
    });
    unmount();
    const pendingSnapshots: boolean[] = [];
    const { result } = renderHook(() => {
      const state = useAccountPageState();
      pendingSnapshots.push(state.signIn.pending);
      return state;
    });
    // Capture the initial render too, before effects can hide a stale loading state.
    expect(pendingSnapshots).not.toContain(true);
    expect(result.current.signIn.pending).toBe(false);
    let newOperation!: Promise<void>;
    act(() => {
      newOperation = runAccountAction(mocks.action, options);
    });

    await actAsync(async () => {
      if (outcome === "success") oldRequest.resolve();
      else oldRequest.reject(new Error("Late failure"));
      await oldOperation;
    });

    expect(result.current.signIn.pending).toBe(true);
    expect(showToast).toHaveBeenCalledTimes(outcome === "success" ? 1 : 0);
    await actAsync(async () => {
      newRequest.resolve();
      await newOperation;
    });
    expect(result.current.signIn.pending).toBe(false);
  });
});
