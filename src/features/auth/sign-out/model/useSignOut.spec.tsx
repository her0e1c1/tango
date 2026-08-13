import { act, renderHook } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { useSignOut } from "./useSignOut";
import { actAsync } from "@/test/act";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const StrictModeWrapper = ({ children }: PropsWithChildren) => <React.StrictMode>{children}</React.StrictMode>;

describe("useSignOut", () => {
  it("deduplicates sign-out while it is pending", async () => {
    const request = deferred<void>();
    const signOut = vi.fn(() => request.promise);
    const { result } = renderHook(() => useSignOut(signOut), { wrapper: StrictModeWrapper });

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

  it("runs sign-out again when retry is requested", async () => {
    const error = new Error("sign out failed");
    const signOut = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSignOut(signOut));

    await actAsync(async () => expect(result.current.signOut()).rejects.toBe(error));
    await actAsync(async () => expect(result.current.retry()).resolves.toBeUndefined());

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ pending: false, error: null });
  });

  it("does not carry cleanup failures to a later mount", async () => {
    const cleanupRetry = vi.fn().mockResolvedValue(undefined);
    const error = Object.assign(new Error("logout cleanup failed"), { retry: cleanupRetry });
    const { result: firstResult, unmount } = renderHook(() => useSignOut(vi.fn().mockRejectedValue(error)), {
      wrapper: StrictModeWrapper,
    });
    await actAsync(async () => expect(firstResult.current.signOut()).rejects.toBe(error));
    unmount();

    const { result } = renderHook(() => useSignOut(), { wrapper: StrictModeWrapper });
    expect(result.current).toMatchObject({ pending: false, error: null });
    expect(cleanupRetry).not.toHaveBeenCalled();
  });
});
