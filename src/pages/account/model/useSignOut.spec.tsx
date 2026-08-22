import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  signOutCurrentUser: vi.fn<() => Promise<void>>(),
}));

vi.mock("./signOut", () => ({ signOutCurrentUser: mocks.signOutCurrentUser }));

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
    mocks.signOutCurrentUser.mockReset();
    mocks.signOutCurrentUser.mockResolvedValue(undefined);
  });

  it("reports a pending sign-out until the operation completes", async () => {
    const request = deferred<void>();
    mocks.signOutCurrentUser.mockReturnValue(request.promise);
    const { result } = renderHook(() => useSignOut());

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
    mocks.signOutCurrentUser.mockRejectedValueOnce(failure).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useSignOut());

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
    mocks.signOutCurrentUser.mockRejectedValue(failure);
    const { result: firstResult, unmount } = renderHook(() => useSignOut());

    await actAsync(async () => {
      await expect(firstResult.current.signOut()).rejects.toThrow("Sign-out failed");
    });
    expect(firstResult.current.error).toBe(failure);
    unmount();

    const { result: secondResult } = renderHook(() => useSignOut());

    expect(secondResult.current.pending).toBe(false);
    expect(secondResult.current.error).toBeNull();
  });
});
