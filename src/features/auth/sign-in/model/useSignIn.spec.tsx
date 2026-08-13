import { act, renderHook } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { useSignIn } from "./useSignIn";
import { actAsync } from "@/test/act";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const StrictModeWrapper = ({ children }: PropsWithChildren) => <React.StrictMode>{children}</React.StrictMode>;

describe("useSignIn", () => {
  it("deduplicates sign-in while it is pending", async () => {
    const request = deferred<void>();
    const signIn = vi.fn(() => request.promise);
    const { result } = renderHook(() => useSignIn(signIn), { wrapper: StrictModeWrapper });

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.signIn();
      second = result.current.signIn();
    });

    expect(signIn).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await Promise.all([first, second]);
    });
    expect(result.current.pending).toBe(false);
  });

  it("runs sign-in again when retry is requested", async () => {
    const error = new Error("sign in failed");
    const signIn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSignIn(signIn));

    await actAsync(async () => expect(result.current.signIn()).rejects.toBe(error));
    expect(result.current).toMatchObject({ pending: false, error });

    await actAsync(async () => expect(result.current.retry()).resolves.toBeUndefined());
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ pending: false, error: null });
  });

  it("clears an earlier failure when a new attempt starts", async () => {
    const error = new Error("sign in failed");
    const request = deferred<void>();
    const signIn = vi.fn().mockRejectedValueOnce(error).mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useSignIn(signIn));
    await actAsync(async () => expect(result.current.signIn()).rejects.toBe(error));

    let attempt!: Promise<void>;
    act(() => {
      attempt = result.current.signIn();
    });
    expect(result.current).toMatchObject({ pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await attempt;
    });
  });

  it("does not carry failures to a later mount", async () => {
    const error = new Error("sign in failed");
    const signIn = vi.fn().mockRejectedValue(error);
    const { result: firstResult, unmount } = renderHook(() => useSignIn(signIn), {
      wrapper: StrictModeWrapper,
    });
    await actAsync(async () => expect(firstResult.current.signIn()).rejects.toBe(error));
    unmount();

    const { result } = renderHook(() => useSignIn(signIn), { wrapper: StrictModeWrapper });
    expect(result.current).toMatchObject({ pending: false, error: null });
  });
});
