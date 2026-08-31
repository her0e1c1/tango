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

const getToast = (callIndex: number) => {
  const toast = vi.mocked(showToast).mock.calls[callIndex]?.[0];
  if (toast === undefined) throw new Error(`Toast call ${callIndex} was not published`);
  return toast;
};

describe("useSignIn", () => {
  beforeEach(() => {
    mocks.loginGoogle.mockReset();
    mocks.loginGoogle.mockResolvedValue(undefined);
    vi.mocked(dismissToast).mockReset();
    vi.mocked(showToast).mockReset();
    let nextToastId = 0;
    vi.mocked(showToast).mockImplementation(() => {
      nextToastId += 1;
      return nextToastId;
    });
  });

  it("ACCOUNT-06 reports a pending sign-in until the operation completes", async () => {
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

  it("ACCOUNT-06 reports a pending sign-in while Retry runs on the mounted owner", async () => {
    const retry = deferred<void>();
    mocks.loginGoogle.mockRejectedValueOnce(new Error("Sign-in failed")).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });

    act(() => {
      getToast(0).action?.onClick();
    });

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("ACCOUNT-06 invalidates the old Retry when a remounted owner reruns sign-in", async () => {
    const rerun = deferred<void>();
    mocks.loginGoogle.mockRejectedValueOnce(new Error("Sign-in failed")).mockReturnValueOnce(rerun.promise);
    const { result, unmount } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    const oldFailureToast = getToast(0);
    unmount();
    const { result: remountedResult } = renderHook(() => useSignIn());
    let operation!: Promise<void>;

    act(() => {
      operation = remountedResult.current.signIn();
    });

    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(remountedResult.current.pending).toBe(true);

    act(() => {
      oldFailureToast.action?.onClick();
    });

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledTimes(1);

    await actAsync(async () => {
      rerun.resolve();
      await operation;
    });
  });

  it("ACCOUNT-01 publishes a completed sign-in after its auth transition unmounts the owner", async () => {
    const request = deferred<void>();
    mocks.loginGoogle.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useSignIn());
    let operation!: Promise<void>;

    act(() => {
      operation = result.current.signIn();
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed in.", tone: "success" });
  });

  it("ACCOUNT-08 keeps a failed sign-in Toast when its owner unmounts", async () => {
    mocks.loginGoogle.mockRejectedValue(new Error("Sign-in failed"));
    const { result, unmount } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    expect(getToast(0)).toMatchObject({
      message: "Unable to sign in.",
      tone: "error",
      action: { label: "Retry" },
    });

    unmount();

    expect(dismissToast).not.toHaveBeenCalled();

    mocks.loginGoogle.mockResolvedValueOnce(undefined);
    act(() => {
      getToast(0).action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(2));
  });

  it("ACCOUNT-02 publishes a late failure and retries it after the owner unmounts", async () => {
    const request = deferred<void>();
    const retry = deferred<void>();
    mocks.loginGoogle.mockReturnValueOnce(request.promise).mockReturnValueOnce(retry.promise);
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

    const failureToast = getToast(0);
    expect(failureToast).toMatchObject({ message: "Unable to sign in.", tone: "error", action: { label: "Retry" } });

    act(() => {
      failureToast.action?.onClick();
    });

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(vi.mocked(dismissToast).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.loginGoogle.mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY
    );

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed in.", tone: "success" });
  });

  it("ACCOUNT-10 publishes a replacement failure and invalidates the stale Retry", async () => {
    mocks.loginGoogle
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockRejectedValueOnce(new Error("Retry failed"));
    const { result } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    const firstFailureToast = getToast(0);

    act(() => {
      firstFailureToast.action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(2));

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(getToast(1)).toMatchObject({
      message: "Unable to sign in.",
      tone: "error",
      action: { label: "Retry" },
    });
    expect(getToast(1).action?.onClick).not.toBe(firstFailureToast.action?.onClick);
    expect(result.current.pending).toBe(false);

    act(() => {
      firstFailureToast.action?.onClick();
    });

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(dismissToast).not.toHaveBeenCalledWith(2);

    mocks.loginGoogle.mockResolvedValueOnce(undefined);
    act(() => {
      getToast(1).action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(3));
  });

  it("ACCOUNT-10 invalidates an earlier failure before an out-of-order failure is published", async () => {
    const earlierRequest = deferred<void>();
    const laterRequest = deferred<void>();
    mocks.loginGoogle.mockReturnValueOnce(earlierRequest.promise).mockReturnValueOnce(laterRequest.promise);
    const { result: earlierResult, unmount } = renderHook(() => useSignIn());
    let earlierOperation!: Promise<void>;

    act(() => {
      earlierOperation = earlierResult.current.signIn();
    });
    unmount();

    const { result: laterResult } = renderHook(() => useSignIn());
    let laterOperation!: Promise<void>;

    act(() => {
      laterOperation = laterResult.current.signIn();
    });

    await actAsync(async () => {
      earlierRequest.reject(new Error("Earlier sign-in failed"));
      await expect(earlierOperation).rejects.toThrow("Earlier sign-in failed");
    });
    const staleFailureToast = getToast(0);

    await actAsync(async () => {
      laterRequest.reject(new Error("Later sign-in failed"));
      await expect(laterOperation).rejects.toThrow("Later sign-in failed");
    });

    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(vi.mocked(dismissToast).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(showToast).mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY
    );
    const currentFailureToast = getToast(1);

    act(() => {
      staleFailureToast.action?.onClick();
    });

    expect(mocks.loginGoogle).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(dismissToast).not.toHaveBeenCalledWith(2);

    mocks.loginGoogle.mockResolvedValueOnce(undefined);
    act(() => {
      currentFailureToast.action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(3));
  });
});
