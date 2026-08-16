import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { actAsync } from "@/test/act";

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
  it("reports a pending sign-in until the operation completes", async () => {
    const request = deferred<void>();
    const { result } = renderHook(() => useSignIn(() => request.promise));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signIn();
    });

    expect(result.current.pending).toBe(true);
    expect(result.current.error).toBeNull();

    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("clears a failed sign-in when the user retries", async () => {
    const failure = new Error("Sign-in failed");
    const retry = deferred<void>();
    let firstAttempt = true;
    const signIn = () => {
      if (firstAttempt) {
        firstAttempt = false;
        return Promise.reject(failure);
      }
      return retry.promise;
    };
    const { result } = renderHook(() => useSignIn(signIn));

    await actAsync(async () => {
      await expect(result.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    expect(result.current.error).toBe(failure);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signIn();
    });

    expect(result.current.pending).toBe(true);
    expect(result.current.error).toBeNull();

    await actAsync(async () => {
      retry.resolve();
      await operation;
    });

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not carry a failed sign-in into a later mount", async () => {
    const failure = new Error("Sign-in failed");
    const signIn = () => Promise.reject(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignIn(signIn));

    await actAsync(async () => {
      await expect(firstResult.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    expect(firstResult.current.error).toBe(failure);
    unmount();

    const { result: secondResult } = renderHook(() => useSignIn(signIn));

    expect(secondResult.current.pending).toBe(false);
    expect(secondResult.current.error).toBeNull();
  });
});
