import { act, renderHook } from "@testing-library/react";
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

describe("useSignOut", () => {
  it("reports pending while sign-out is running", async () => {
    const request = deferred<void>();
    const signOut = vi.fn(() => request.promise);
    const { result } = renderHook(() => useSignOut(signOut));

    let attempt!: Promise<void>;
    act(() => {
      attempt = result.current.signOut();
    });

    expect(signOut).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await attempt;
    });
    expect(result.current.pending).toBe(false);
  });

  it("allows sign-out again after a failure", async () => {
    const error = new Error("sign out failed");
    const signOut = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSignOut(signOut));

    await actAsync(async () => expect(result.current.signOut()).rejects.toBe(error));
    await actAsync(async () => expect(result.current.signOut()).resolves.toBeUndefined());

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ pending: false, error: null });
  });

  it("does not carry failures to a later mount", async () => {
    const error = new Error("sign out failed");
    const signOut = vi.fn().mockRejectedValue(error);
    const { result: firstResult, unmount } = renderHook(() => useSignOut(signOut));
    await actAsync(async () => expect(firstResult.current.signOut()).rejects.toBe(error));
    unmount();

    const { result } = renderHook(() => useSignOut(signOut));
    expect(result.current).toMatchObject({ pending: false, error: null });
  });
});
