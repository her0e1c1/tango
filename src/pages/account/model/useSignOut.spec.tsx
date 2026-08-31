import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, showToast } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
  dismissToast: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("./signOut", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));
vi.mock("@/shared/ui/toast", () => ({ dismissToast: mocks.dismissToast, showToast: mocks.showToast }));

import { useSignOut } from "./useSignOut";

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

describe("useSignOut", () => {
  beforeEach(() => {
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
    vi.mocked(dismissToast).mockReset();
    vi.mocked(showToast).mockReset();
    let nextToastId = 0;
    vi.mocked(showToast).mockImplementation(() => {
      nextToastId += 1;
      return nextToastId;
    });
  });

  it("ACCOUNT-07 reports a pending sign-out until the operation completes", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result } = renderHook(() => useSignOut());

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signOut();
    });

    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("ACCOUNT-07 reports a pending sign-out while Retry runs on the mounted owner", async () => {
    const retry = deferred<void>();
    mocks.signOutCurrentUser.mockRejectedValueOnce(new Error("Sign-out failed")).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });

    act(() => {
      getToast(0).action?.onClick();
    });

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(result.current.pending).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("ACCOUNT-07 invalidates the old Retry when a remounted owner reruns sign-out", async () => {
    const rerun = deferred<void>();
    mocks.signOutCurrentUser.mockRejectedValueOnce(new Error("Sign-out failed")).mockReturnValueOnce(rerun.promise);
    const { result, unmount } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    const oldFailureToast = getToast(0);
    unmount();
    const { result: remountedResult } = renderHook(() => useSignOut());
    let operation!: Promise<void>;

    act(() => {
      operation = remountedResult.current.signOut();
    });

    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(remountedResult.current.pending).toBe(true);

    act(() => {
      oldFailureToast.action?.onClick();
    });

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledTimes(1);

    await actAsync(async () => {
      rerun.resolve();
      await operation;
    });
  });

  it("ACCOUNT-03 publishes a completed sign-out after its auth transition unmounts the owner", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result, unmount } = renderHook(() => useSignOut());
    let operation!: Promise<void>;

    act(() => {
      operation = result.current.signOut();
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message: "Signed out.", tone: "success" });
  });

  it("ACCOUNT-09 keeps a failed sign-out Toast when its owner unmounts", async () => {
    mocks.signOutCurrentUser.mockRejectedValue(new Error("Sign-out failed"));
    const { result, unmount } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    expect(getToast(0)).toMatchObject({
      message: "Unable to sign out.",
      tone: "error",
      action: { label: "Retry" },
    });

    unmount();

    expect(dismissToast).not.toHaveBeenCalled();

    mocks.signOutCurrentUser.mockResolvedValueOnce(undefined);
    act(() => {
      getToast(0).action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(2));
  });

  it("ACCOUNT-05 publishes a late failure and retries it after the owner unmounts", async () => {
    const request = deferred<void>();
    const retry = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValueOnce(request.promise).mockReturnValueOnce(retry.promise);
    const { result, unmount } = renderHook(() => useSignOut());
    let operation!: Promise<void>;

    act(() => {
      operation = result.current.signOut();
    });
    unmount();
    await actAsync(async () => {
      request.reject(new Error("Late sign-out failure"));
      await expect(operation).rejects.toThrow("Late sign-out failure");
    });

    const failureToast = getToast(0);
    expect(failureToast).toMatchObject({ message: "Unable to sign out.", tone: "error", action: { label: "Retry" } });

    act(() => {
      failureToast.action?.onClick();
    });

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(vi.mocked(dismissToast).mock.invocationCallOrder[0]).toBeLessThan(
      mocks.signOutCurrentUser.mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY
    );

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });
  });

  it("ACCOUNT-11 publishes a replacement failure and invalidates the stale Retry", async () => {
    mocks.signOutCurrentUser
      .mockRejectedValueOnce(new Error("Sign-out failed"))
      .mockRejectedValueOnce(new Error("Retry failed"));
    const { result } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    const firstFailureToast = getToast(0);

    act(() => {
      firstFailureToast.action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(2));

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(getToast(1)).toMatchObject({
      message: "Unable to sign out.",
      tone: "error",
      action: { label: "Retry" },
    });
    expect(getToast(1).action?.onClick).not.toBe(firstFailureToast.action?.onClick);
    expect(result.current.pending).toBe(false);

    act(() => {
      firstFailureToast.action?.onClick();
    });

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(dismissToast).not.toHaveBeenCalledWith(2);

    mocks.signOutCurrentUser.mockResolvedValueOnce(undefined);
    act(() => {
      getToast(1).action?.onClick();
    });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(3));
  });

  it("ACCOUNT-11 invalidates an earlier failure before an out-of-order success is published", async () => {
    const earlierRequest = deferred<void>();
    const laterRequest = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValueOnce(earlierRequest.promise).mockReturnValueOnce(laterRequest.promise);
    const { result: earlierResult, unmount } = renderHook(() => useSignOut());
    let earlierOperation!: Promise<void>;

    act(() => {
      earlierOperation = earlierResult.current.signOut();
    });
    unmount();

    const { result: laterResult } = renderHook(() => useSignOut());
    let laterOperation!: Promise<void>;

    act(() => {
      laterOperation = laterResult.current.signOut();
    });

    await actAsync(async () => {
      earlierRequest.reject(new Error("Earlier sign-out failed"));
      await expect(earlierOperation).rejects.toThrow("Earlier sign-out failed");
    });
    const staleFailureToast = getToast(0);

    await actAsync(async () => {
      laterRequest.resolve();
      await laterOperation;
    });

    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
    expect(vi.mocked(dismissToast).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(showToast).mock.invocationCallOrder[1] ?? Number.POSITIVE_INFINITY
    );
    expect(showToast).toHaveBeenLastCalledWith({ message: "Signed out.", tone: "success" });

    act(() => {
      staleFailureToast.action?.onClick();
    });

    expect(mocks.signOutCurrentUser).toHaveBeenCalledTimes(2);
    expect(dismissToast).toHaveBeenCalledExactlyOnceWith(1);
  });
});
