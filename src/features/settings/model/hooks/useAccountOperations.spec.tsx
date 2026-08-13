/**
 * @file Verifies the "useAccountOperations" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "deduplicates login while
 * login is pending", "deduplicates logout while logout is pending", "retries the failed operation".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { useAccountOperations } from "./useAccountOperations";
import { actAsync } from "@/test/act";

/**
 * Provides the deferred test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

/**
 * Renders the test-only Strict Mode Wrapper component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const StrictModeWrapper = ({ children }: PropsWithChildren) => <React.StrictMode>{children}</React.StrictMode>;

describe("useAccountOperations", () => {
  it("deduplicates login while login is pending", async () => {
    const request = deferred<void>();
    const login = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }), { wrapper: StrictModeWrapper });

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.login();
      second = result.current.login();
    });

    expect(login).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await Promise.all([first, second]);
    });

    expect(result.current.pending).toBe(false);
  });

  it("keeps the pending login when logout is unavailable", async () => {
    const request = deferred<void>();
    const login = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }), { wrapper: StrictModeWrapper });

    let loginPromise!: Promise<void>;
    let logoutPromise!: Promise<void>;
    act(() => {
      loginPromise = result.current.login();
      logoutPromise = result.current.logout();
    });

    expect(login).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await Promise.all([loginPromise, logoutPromise]);
    });

    expect(result.current.pending).toBe(false);
  });

  it("deduplicates logout while logout is pending", async () => {
    const request = deferred<void>();
    const logout = vi.fn(() => request.promise);
    const { result } = renderHook(() => useAccountOperations({ login: vi.fn(), logout }), {
      wrapper: StrictModeWrapper,
    });

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.logout();
      second = result.current.logout();
    });

    expect(logout).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "logout", pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await Promise.all([first, second]);
    });

    expect(result.current.pending).toBe(false);
  });

  it("retries the failed operation", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAccountOperations({ login }));

    await actAsync(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });

    expect(result.current).toMatchObject({ kind: "login", pending: false, error });

    await actAsync(async () => {
      await expect(result.current.retry()).resolves.toBeUndefined();
    });

    expect(login).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ kind: "login", pending: false, error: null });
  });

  it("clears an earlier failure when a new attempt starts", async () => {
    const error = new Error("sign in failed");
    const request = deferred<void>();
    const login = vi.fn().mockRejectedValueOnce(error).mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useAccountOperations({ login }));

    await actAsync(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);

    let retry!: Promise<void>;
    act(() => {
      retry = result.current.login();
    });

    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await actAsync(async () => {
      request.resolve();
      await retry;
    });

    expect(result.current).toMatchObject({ kind: "login", pending: false, error: null });
  });

  it("discards a settled failure after Settings is left", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValue(error);
    const { result: firstResult, unmount: unmountFirst } = renderHook(
      () => useAccountOperations({ login, generation: "user-a" }),
      {
        wrapper: StrictModeWrapper,
      }
    );

    await actAsync(async () => {
      await expect(firstResult.current.login()).rejects.toBe(error);
    });
    unmountFirst();
    await actAsync(async () => Promise.resolve());

    const { result: nextResult } = renderHook(() => useAccountOperations({ login, generation: "user-a" }), {
      wrapper: StrictModeWrapper,
    });
    expect(nextResult.current).toMatchObject({ kind: null, pending: false, error: null });
    await expect(nextResult.current.retry()).resolves.toBeUndefined();
    expect(login).toHaveBeenCalledOnce();
  });

  it("discards settled feedback after an unrelated auth generation", async () => {
    const error = new Error("sign in failed");
    const login = vi.fn().mockRejectedValue(error);
    const { result, rerender } = renderHook(({ generation }) => useAccountOperations({ login, generation }), {
      initialProps: { generation: "user-a" },
      wrapper: StrictModeWrapper,
    });

    await actAsync(async () => {
      await expect(result.current.login()).rejects.toBe(error);
    });
    rerender({ generation: "user-b" });

    await waitFor(() => expect(result.current).toMatchObject({ kind: null, pending: false, error: null }));
    await expect(result.current.retry()).resolves.toBeUndefined();
    expect(login).toHaveBeenCalledOnce();
  });

  it("hands retryable logout cleanup to one auth-driven remount", async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const error = Object.assign(new Error("logout cleanup failed"), { retry });
    const logout = vi.fn().mockRejectedValue(error);
    const { result: firstResult, unmount: unmountFirst } = renderHook(
      () => useAccountOperations({ login: vi.fn(), logout, generation: "authenticated-user" }),
      {
        wrapper: StrictModeWrapper,
      }
    );

    await actAsync(async () => {
      await expect(firstResult.current.logout()).rejects.toBe(error);
    });
    unmountFirst();
    await actAsync(async () => Promise.resolve());

    const { result: anonymousResult, unmount: unmountAnonymous } = renderHook(
      () => useAccountOperations({ login: vi.fn(), logout: vi.fn(), generation: "anonymous-user" }),
      { wrapper: StrictModeWrapper }
    );
    expect(anonymousResult.current).toMatchObject({ kind: "logout", pending: false, error });

    unmountAnonymous();
    await actAsync(async () => Promise.resolve());
    const { result: laterResult } = renderHook(
      () => useAccountOperations({ login: vi.fn(), logout: vi.fn(), generation: "anonymous-user" }),
      { wrapper: StrictModeWrapper }
    );
    expect(laterResult.current).toMatchObject({ kind: null, pending: false, error: null });
    expect(retry).not.toHaveBeenCalled();
  });

  it("resets an in-flight cleanup retry when a later auth generation takes over", async () => {
    const cleanupRequest = deferred<void>();
    const cleanupFailure = new Error("cleanup retry failed");
    const retryCleanup = vi.fn(() => cleanupRequest.promise);
    const initialFailure = Object.assign(new Error("logout cleanup failed"), { retry: retryCleanup });
    const { result: firstResult, unmount: unmountFirst } = renderHook(
      () =>
        useAccountOperations({
          generation: "authenticated-user",
          login: vi.fn(),
          logout: vi.fn().mockRejectedValue(initialFailure),
        }),
      { wrapper: StrictModeWrapper }
    );

    await actAsync(async () => {
      await expect(firstResult.current.logout()).rejects.toBe(initialFailure);
    });
    unmountFirst();
    await actAsync(async () => Promise.resolve());

    const nextLoginRequest = deferred<void>();
    const nextLogin = vi.fn(() => nextLoginRequest.promise);
    const { result, rerender } = renderHook(
      ({ generation }) => useAccountOperations({ generation, login: nextLogin, logout: vi.fn() }),
      { initialProps: { generation: "anonymous-user" }, wrapper: StrictModeWrapper }
    );
    expect(result.current).toMatchObject({ kind: "logout", pending: false, error: initialFailure });

    let staleRetry!: Promise<void>;
    act(() => {
      staleRetry = result.current.retry();
    });
    expect(retryCleanup).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "logout", pending: true, error: null });

    rerender({ generation: "later-user" });
    await waitFor(() => expect(result.current).toMatchObject({ kind: null, pending: false, error: null }));
    const retryAfterReset = result.current.retry();
    await expect(retryAfterReset).resolves.toBeUndefined();
    expect(retryCleanup).toHaveBeenCalledOnce();

    let nextOperation!: Promise<void>;
    act(() => {
      nextOperation = result.current.login();
    });
    expect(nextLogin).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await actAsync(async () => {
      cleanupRequest.reject(cleanupFailure);
      await expect(staleRetry).rejects.toBe(cleanupFailure);
    });
    expect(result.current).toMatchObject({ kind: "login", pending: true, error: null });

    await actAsync(async () => {
      nextLoginRequest.resolve();
      await nextOperation;
    });
    expect(result.current).toMatchObject({ kind: "login", pending: false, error: null });
  });
});
