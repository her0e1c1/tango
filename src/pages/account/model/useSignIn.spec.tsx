import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  loginGoogle: vi.fn<() => Promise<unknown>>(),
  dismissToast: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("./signIn", () => ({ loginGoogle: mocks.loginGoogle }));
vi.mock("@/shared/ui/toast", () => ({ dismissToast: mocks.dismissToast, showToast: mocks.showToast }));

import { useSignIn } from "./useSignIn";

const deferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

describe("useSignIn", () => {
  beforeEach(() => {
    mocks.loginGoogle.mockReset();
    mocks.loginGoogle.mockResolvedValue(undefined);
    vi.mocked(dismissToast).mockReset();
    vi.mocked(showToast).mockReset();
    vi.mocked(showToast).mockReturnValue(1);
  });

  it("reports a pending sign-in until the operation completes", async () => {
    const request = deferred<void>();
    mocks.loginGoogle.mockReturnValue(request.promise);
    const { result } = renderHook(() => useSignIn());

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signIn();
    });

    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("offers a Toast action that dismisses and retries a failed sign-in", async () => {
    const failure = new Error("Sign-in failed");
    const retry = deferred<void>();
    mocks.loginGoogle.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    const failureToast = vi.mocked(showToast).mock.calls[0]?.[0];
    if (failureToast === undefined) throw new Error("Sign-in failure Toast was not shown");
    expect(failureToast).toMatchObject({ message: "Unable to sign in.", tone: "error", action: { label: "Retry" } });

    act(() => {
      failureToast.action?.onClick();
    });

    expect(dismissToast).toHaveBeenCalledWith(1);
    expect(vi.mocked(dismissToast).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.loginGoogle.mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY
    );
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("dismisses its failed sign-in Toast when its owner unmounts", async () => {
    const failure = new Error("Sign-in failed");
    mocks.loginGoogle.mockRejectedValue(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(firstResult.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    unmount();

    expect(dismissToast).toHaveBeenCalledWith(1);
  });

  it("does not show a failure Toast when sign-in rejects after unmount", async () => {
    const request = deferred<void>();
    mocks.loginGoogle.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useSignIn());
    let operation!: Promise<void>;

    act(() => {
      operation = result.current.signIn();
    });
    unmount();
    await actAsync(async () => {
      request.reject(new Error("Late sign-in failure"));
      await expect(operation).rejects.toThrow("Late sign-in failure");
    });

    expect(showToast).not.toHaveBeenCalled();
  });
});
