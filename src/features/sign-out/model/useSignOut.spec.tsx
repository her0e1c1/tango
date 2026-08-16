import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { replaceAuthSession } from "@/entities/auth";
import { actAsync } from "@/test/act";

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

describe("useSignOut", () => {
  beforeEach(() => {
    replaceAuthSession({ status: "initializing" });
  });

  it("reports a pending sign-out until the operation completes", async () => {
    const request = deferred<void>();
    const { result } = renderHook(() => useSignOut(() => request.promise));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signOut();
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

  it("clears a failed sign-out when the user retries", async () => {
    const failure = new Error("Sign-out failed");
    const retry = deferred<void>();
    let firstAttempt = true;
    const signOut = () => {
      if (firstAttempt) {
        firstAttempt = false;
        return Promise.reject(failure);
      }
      return retry.promise;
    };
    const { result } = renderHook(() => useSignOut(signOut));

    await actAsync(async () => {
      await expect(result.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    expect(result.current.error).toBe(failure);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.signOut();
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

  it("does not carry a failed sign-out into a later mount", async () => {
    const failure = new Error("Sign-out failed");
    const signOut = () => Promise.reject(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignOut(signOut));

    await actAsync(async () => {
      await expect(firstResult.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    expect(firstResult.current.error).toBe(failure);
    unmount();

    const { result: secondResult } = renderHook(() => useSignOut(signOut));

    expect(secondResult.current.pending).toBe(false);
    expect(secondResult.current.error).toBeNull();
  });

  it("reflects the current account identity and login state", () => {
    replaceAuthSession({
      displayName: "Ada",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    const { result } = renderHook(() => useSignOut(() => Promise.resolve()));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.identity).toEqual({
      displayName: "Ada",
      uid: "linked-user",
    });

    act(() => {
      replaceAuthSession({
        displayName: null,
        isAnonymous: true,
        status: "authenticated",
        uid: "anonymous-user",
      });
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.identity).toEqual({
      displayName: null,
      uid: "anonymous-user",
    });
  });
});
