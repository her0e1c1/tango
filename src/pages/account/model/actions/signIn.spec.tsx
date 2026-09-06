import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn<() => Promise<unknown>>(),
  showToast: vi.fn(),
}));

vi.mock("../../api/signInWithGoogle", () => ({ signInWithGoogle: mocks.signInWithGoogle }));
vi.mock("@/shared/ui/toast", () => ({ showToast: mocks.showToast }));

import { signIn } from "./signIn";
import { createAccountPageStore } from "../store";

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
    mocks.signInWithGoogle.mockReset();
    mocks.signInWithGoogle.mockResolvedValue(undefined);
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("keeps sign-in pending when requested again before completion", async () => {
    const request = deferred<void>();
    mocks.signInWithGoogle.mockReturnValue(request.promise);
    const store = createAccountPageStore();
    const { result } = renderHook(useMountedGuard);

    let operation!: Promise<void>;
    let duplicateOperation!: Promise<void>;
    act(() => {
      operation = signIn(store, result.current);
      duplicateOperation = signIn(store, result.current);
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

  it("allows the primary sign-in action to retry after a handled failure", async () => {
    const failure = new Error("Sign-in failed");
    const retry = deferred<void>();
    mocks.signInWithGoogle.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const store = createAccountPageStore();
    const { result } = renderHook(useMountedGuard);

    await actAsync(async () => {
      await expect(signIn(store, result.current)).resolves.toBeUndefined();
    });
    expect(showToast).toHaveBeenCalledWith({ message: "Unable to sign in.", tone: "error" });

    let retryOperation!: Promise<void>;
    act(() => {
      retryOperation = signIn(store, result.current);
    });

    expect(store.getState().signIn.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retryOperation;
    });

    expect(store.getState().signIn.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("does not show a failure Toast when sign-in rejects after unmount", async () => {
    const request = deferred<void>();
    mocks.signInWithGoogle.mockReturnValue(request.promise);
    const store = createAccountPageStore();
    const { result, unmount } = renderHook(useMountedGuard);
    let operation!: Promise<void>;

    act(() => {
      operation = signIn(store, result.current);
    });
    unmount();
    await actAsync(async () => {
      request.reject(new Error("Late sign-in failure"));
      await expect(operation).resolves.toBeUndefined();
    });

    expect(showToast).not.toHaveBeenCalled();
  });
});
