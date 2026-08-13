import { act, renderHook, waitFor } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { useSignOut } from "./useSignOut";
import { actAsync } from "@/test/act";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
};

const StrictModeWrapper = ({ children }: PropsWithChildren) => <React.StrictMode>{children}</React.StrictMode>;

describe("useSignOut", () => {
  it("deduplicates sign-out while it is pending", async () => {
    const request = deferred<void>();
    const signOut = vi.fn(() => request.promise);
    const { result } = renderHook(() => useSignOut({ generation: "user-a", signOut }), {
      wrapper: StrictModeWrapper,
    });

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.signOut();
      second = result.current.signOut();
    });

    expect(signOut).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await Promise.all([first, second]);
    });
    expect(result.current.pending).toBe(false);
  });

  it("retries a failed sign-out", async () => {
    const error = new Error("sign out failed");
    const signOut = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSignOut({ generation: "user-a", signOut }));

    await actAsync(async () => expect(result.current.signOut()).rejects.toBe(error));
    await actAsync(async () => expect(result.current.retry()).resolves.toBeUndefined());

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ pending: false, error: null });
  });

  it("hands retryable cleanup to one auth-driven remount", async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const error = Object.assign(new Error("logout cleanup failed"), { retry });
    const { result: firstResult, unmount: unmountFirst } = renderHook(
      () => useSignOut({ generation: "authenticated", signOut: vi.fn().mockRejectedValue(error) }),
      { wrapper: StrictModeWrapper }
    );
    await actAsync(async () => expect(firstResult.current.signOut()).rejects.toBe(error));
    unmountFirst();
    await actAsync(async () => Promise.resolve());

    const { result: anonymousResult, unmount: unmountAnonymous } = renderHook(
      () => useSignOut({ generation: "anonymous" }),
      { wrapper: StrictModeWrapper }
    );
    expect(anonymousResult.current).toMatchObject({ pending: false, error });
    unmountAnonymous();
    await actAsync(async () => Promise.resolve());

    const { result: laterResult } = renderHook(() => useSignOut({ generation: "anonymous" }), {
      wrapper: StrictModeWrapper,
    });
    expect(laterResult.current).toMatchObject({ pending: false, error: null });
    expect(retry).not.toHaveBeenCalled();
  });

  it("ignores an obsolete cleanup retry after another auth generation takes over", async () => {
    const retryRequest = deferred<void>();
    const retry = vi.fn(() => retryRequest.promise);
    const error = Object.assign(new Error("logout cleanup failed"), { retry });
    const { result: firstResult, unmount } = renderHook(
      () => useSignOut({ generation: "authenticated", signOut: vi.fn().mockRejectedValue(error) }),
      { wrapper: StrictModeWrapper }
    );
    await actAsync(async () => expect(firstResult.current.signOut()).rejects.toBe(error));
    unmount();
    await actAsync(async () => Promise.resolve());

    const { result, rerender } = renderHook(({ generation }) => useSignOut({ generation }), {
      initialProps: { generation: "anonymous" },
      wrapper: StrictModeWrapper,
    });
    let staleRetry!: Promise<void>;
    act(() => {
      staleRetry = result.current.retry();
    });
    rerender({ generation: "later-user" });
    await waitFor(() => expect(result.current).toMatchObject({ pending: false, error: null }));

    const retryError = new Error("late retry failure");
    await actAsync(async () => {
      retryRequest.reject(retryError);
      await expect(staleRetry).rejects.toBe(retryError);
    });
    expect(result.current).toMatchObject({ pending: false, error: null });
    await expect(result.current.retry()).resolves.toBeUndefined();
  });
});
