import { act, renderHook, waitFor } from "@testing-library/react";
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
    const { result } = renderHook(() => useSignIn({ generation: "anonymous", signIn }), {
      wrapper: StrictModeWrapper,
    });

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

  it("retries the failed operation", async () => {
    const error = new Error("sign in failed");
    const signIn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useSignIn({ generation: "anonymous", signIn }));

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
    const { result } = renderHook(() => useSignIn({ generation: "anonymous", signIn }));
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

  it("discards settled feedback after the screen is left", async () => {
    const error = new Error("sign in failed");
    const signIn = vi.fn().mockRejectedValue(error);
    const { result: firstResult, unmount } = renderHook(() => useSignIn({ generation: "anonymous", signIn }), {
      wrapper: StrictModeWrapper,
    });
    await actAsync(async () => expect(firstResult.current.signIn()).rejects.toBe(error));
    unmount();
    await actAsync(async () => Promise.resolve());

    const { result: nextResult } = renderHook(() => useSignIn({ generation: "anonymous", signIn }), {
      wrapper: StrictModeWrapper,
    });
    expect(nextResult.current).toMatchObject({ pending: false, error: null });
    await expect(nextResult.current.retry()).resolves.toBeUndefined();
    expect(signIn).toHaveBeenCalledOnce();
  });

  it("discards feedback after an unrelated auth generation", async () => {
    const error = new Error("sign in failed");
    const signIn = vi.fn().mockRejectedValue(error);
    const { result, rerender } = renderHook(({ generation }) => useSignIn({ generation, signIn }), {
      initialProps: { generation: "anonymous-a" },
      wrapper: StrictModeWrapper,
    });
    await actAsync(async () => expect(result.current.signIn()).rejects.toBe(error));

    rerender({ generation: "anonymous-b" });

    await waitFor(() => expect(result.current).toMatchObject({ pending: false, error: null }));
    await expect(result.current.retry()).resolves.toBeUndefined();
  });

  it("ignores a late completion from an earlier auth generation", async () => {
    const firstRequest = deferred<void>();
    const nextRequest = deferred<void>();
    const signIn = vi.fn().mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(nextRequest.promise);
    const { result, rerender } = renderHook(({ generation }) => useSignIn({ generation, signIn }), {
      initialProps: { generation: "anonymous-a" },
      wrapper: StrictModeWrapper,
    });

    let firstAttempt!: Promise<void>;
    act(() => {
      firstAttempt = result.current.signIn();
    });
    rerender({ generation: "anonymous-b" });

    let nextAttempt!: Promise<void>;
    act(() => {
      nextAttempt = result.current.signIn();
    });
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      firstRequest.resolve();
      await firstAttempt;
    });
    expect(result.current.pending).toBe(true);

    await actAsync(async () => {
      nextRequest.resolve();
      await nextAttempt;
    });
    expect(result.current.pending).toBe(false);
  });
});
