import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  loginGoogle: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("./signIn", () => ({ loginGoogle: mocks.loginGoogle }));

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
    mocks.loginGoogle.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignIn());

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
    mocks.loginGoogle.mockRejectedValue(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignIn());

    await actAsync(async () => {
      await expect(firstResult.current.signIn()).rejects.toThrow("Sign-in failed");
    });
    expect(firstResult.current.error).toBe(failure);
    unmount();

    const { result: secondResult } = renderHook(() => useSignIn());

    expect(secondResult.current.pending).toBe(false);
    expect(secondResult.current.error).toBeNull();
  });
});
