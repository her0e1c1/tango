import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  loginGoogle: vi.fn<() => Promise<unknown>>(),
  showToast: vi.fn(),
}));

vi.mock("./loginGoogle", () => ({ loginGoogle: mocks.loginGoogle }));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

import { signIn } from "./signIn";
import { useAccountPageState } from "../useAccountPageState";

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("ACCOUNT-02 signIn", () => {
  beforeEach(() => {
    mocks.loginGoogle.mockReset();
    mocks.loginGoogle.mockResolvedValue(undefined);
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("keeps sign-in pending when requested again before completion", async () => {
    const request = deferred<void>();
    mocks.loginGoogle.mockReturnValue(request.promise);
    const { result } = renderHook(() => useAccountPageState());

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = signIn(result.current.store, result.current.isMounted);
      duplicateOperation = signIn(result.current.store, result.current.isMounted);
    });

    await actAsync(async () => {
      await duplicateOperation;
    });

    expect(result.current.pageState.signIn.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pageState.signIn.pending).toBe(false);
    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed in.", tone: "success" });
  });

  it("allows the primary sign-in action to retry after a handled failure", async () => {
    const failure = new Error("Sign-in failed");
    const retry = deferred<void>();
    mocks.loginGoogle.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useAccountPageState());

    await actAsync(async () => {
      await expect(signIn(result.current.store, result.current.isMounted)).resolves.toBeUndefined();
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign in.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = signIn(result.current.store, result.current.isMounted);
    });

    expect(result.current.pageState.signIn.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(result.current.pageState.signIn.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("does not show a failure Toast when sign-in rejects after unmount", async () => {
    const request = deferred<void>();
    mocks.loginGoogle.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useAccountPageState());
    let operation!: Promise<void>;

    act(() => {
      operation = signIn(result.current.store, result.current.isMounted);
    });
    unmount();
    await actAsync(async () => {
      request.reject(new Error("Late sign-in failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(showToast).not.toHaveBeenCalled();
  });
});
